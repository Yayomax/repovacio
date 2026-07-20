"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  getStoreConfig,
  mpConfigured,
  transferConfigured,
} from "@/lib/store-config";
import { checkoutSchema, type CheckoutInput } from "@/lib/validators";
import { generateOrderCode } from "@/lib/utils";
import { createPreference } from "@/lib/mercadopago";
import { sendMail } from "@/lib/mailer";
import { adminNewOrderEmail, orderReceivedEmail } from "@/lib/email-templates";

type CreateOrderResult =
  | { ok: true; code: string; redirectUrl?: string }
  | { ok: false; error: string };

export async function createOrder(
  input: CheckoutInput
): Promise<CreateOrderResult> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, error: "Tienes que iniciar sesión para comprar." };
  }

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    };
  }
  const data = parsed.data;

  const config = await getStoreConfig();
  if (data.paymentMethod === "MERCADOPAGO" && !mpConfigured(config)) {
    return { ok: false, error: "Mercado Pago no está disponible por ahora." };
  }
  if (data.paymentMethod === "TRANSFER" && !transferConfigured(config)) {
    return { ok: false, error: "El pago por transferencia no está disponible." };
  }

  // Opción de envío (opcional)
  const shippingOption = data.shippingOptionId
    ? await prisma.shippingOption.findFirst({
        where: { id: data.shippingOptionId, active: true },
      })
    : null;
  if (data.shippingOptionId && !shippingOption) {
    return { ok: false, error: "La opción de envío elegida ya no está disponible." };
  }

  // Crea el pedido reservando stock de forma atómica: si alguna variante
  // no tiene stock suficiente, la transacción entera se revierte.
  let orderId: string;
  try {
    orderId = await prisma.$transaction(async (tx) => {
      const lines: {
        productId: string;
        variantId: string;
        productName: string;
        variantName: string;
        imagePath: string | null;
        unitCents: number;
        quantity: number;
      }[] = [];

      for (const item of data.items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          include: {
            product: {
              include: { images: { orderBy: { position: "asc" }, take: 1 } },
            },
          },
        });
        if (!variant || !variant.product.active) {
          throw new Error("Uno de los productos ya no está disponible.");
        }

        const reserved = await tx.productVariant.updateMany({
          where: { id: item.variantId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (reserved.count === 0) {
          throw new Error(
            `No hay stock suficiente de "${variant.product.name}${variant.name !== "Único" ? ` (${variant.name})` : ""}".`
          );
        }

        lines.push({
          productId: variant.productId,
          variantId: variant.id,
          productName: variant.product.name,
          variantName: variant.name,
          imagePath: variant.product.images[0]?.path ?? null,
          unitCents: variant.priceCents ?? variant.product.priceCents,
          quantity: item.quantity,
        });
      }

      const subtotalCents = lines.reduce(
        (sum, line) => sum + line.unitCents * line.quantity,
        0
      );
      const shippingCents = shippingOption?.priceCents ?? 0;

      const order = await tx.order.create({
        data: {
          code: generateOrderCode(),
          userId: session.user.id,
          email: data.email,
          name: data.name,
          phone: data.phone || null,
          address: data.address || null,
          notes: data.notes || null,
          shippingName: shippingOption?.name ?? null,
          shippingCents,
          subtotalCents,
          totalCents: subtotalCents + shippingCents,
          paymentMethod: data.paymentMethod,
          items: { create: lines },
        },
      });
      return order.id;
    });
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "No se pudo crear el pedido.",
    };
  }

  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: true },
  });

  // Mercado Pago: crear la preferencia y redirigir al checkout
  let redirectUrl: string | undefined;
  if (data.paymentMethod === "MERCADOPAGO") {
    const preference = await createPreference(config, order);
    if ("error" in preference) {
      // Devolvemos el stock y cancelamos: el pago no se puede iniciar.
      await prisma.$transaction([
        ...order.items
          .filter((item) => item.variantId)
          .map((item) =>
            prisma.productVariant.update({
              where: { id: item.variantId! },
              data: { stock: { increment: item.quantity } },
            })
          ),
        prisma.order.update({
          where: { id: order.id },
          data: { status: "CANCELLED" },
        }),
      ]);
      return { ok: false, error: preference.error };
    }
    await prisma.order.update({
      where: { id: order.id },
      data: { mpPreferenceId: preference.preferenceId },
    });
    redirectUrl = preference.initPoint;
  }

  // Emails: confirmación al cliente + aviso al admin
  const customerEmail = orderReceivedEmail(config, order);
  await sendMail(config, { to: order.email, ...customerEmail });
  if (config.adminNotifyEmail) {
    const adminEmail = adminNewOrderEmail(config, order);
    await sendMail(config, { to: config.adminNotifyEmail, ...adminEmail });
  }

  return { ok: true, code: order.code, redirectUrl };
}

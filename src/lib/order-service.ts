import { prisma } from "@/lib/prisma";
import { getStoreConfig } from "@/lib/store-config";
import { getPayment } from "@/lib/mercadopago";
import { sendMail } from "@/lib/mailer";
import { paymentConfirmedEmail } from "@/lib/email-templates";

/**
 * Marca un pedido como pagado (idempotente) y envía el email de confirmación.
 * Lo usan: el webhook de MP, la verificación al volver del checkout y la
 * validación manual del admin para transferencias.
 */
export async function markOrderPaid(
  orderId: string,
  mpPaymentId?: string
): Promise<boolean> {
  const updated = await prisma.order.updateMany({
    where: { id: orderId, status: "PENDING" },
    data: {
      status: "PAID",
      paidAt: new Date(),
      ...(mpPaymentId ? { mpPaymentId } : {}),
    },
  });
  if (updated.count === 0) return false; // ya estaba pagado/cancelado

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (order) {
    const config = await getStoreConfig();
    const email = paymentConfirmedEmail(config, order);
    await sendMail(config, { to: order.email, ...email });
  }
  return true;
}

/**
 * Verifica un pago de Mercado Pago contra la API y, si está aprobado y
 * corresponde al pedido, lo marca como pagado.
 */
export async function verifyMpPayment(paymentId: string): Promise<boolean> {
  const config = await getStoreConfig();
  const payment = await getPayment(config, paymentId);
  if (!payment || payment.status !== "approved" || !payment.external_reference) {
    return false;
  }

  const order = await prisma.order.findUnique({
    where: { id: payment.external_reference },
  });
  if (!order || order.paymentMethod !== "MERCADOPAGO") return false;

  return markOrderPaid(order.id, String(payment.id));
}

/** Cancela un pedido y devuelve el stock reservado de cada variante. */
export async function cancelOrder(orderId: string): Promise<boolean> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order || order.status === "CANCELLED" || order.status === "FULFILLED") {
    return false;
  }

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
      where: { id: orderId },
      data: { status: "CANCELLED" },
    }),
  ]);
  return true;
}

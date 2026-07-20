"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cancelOrder, markOrderPaid } from "@/lib/order-service";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("No autorizado.");
}

function revalidateOrder(orderId: string) {
  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${orderId}`);
  revalidatePath("/admin");
}

/** Validación manual del pago (típicamente al recibir el comprobante de transferencia). */
export async function confirmarPago(
  orderId: string
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const marked = await markOrderPaid(orderId);
  if (!marked) {
    return { ok: false, error: "El pedido ya no estaba pendiente." };
  }
  revalidateOrder(orderId);
  return { ok: true };
}

export async function marcarEntregado(
  orderId: string
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const updated = await prisma.order.updateMany({
    where: { id: orderId, status: "PAID" },
    data: { status: "FULFILLED" },
  });
  if (updated.count === 0) {
    return { ok: false, error: "Solo se puede entregar un pedido pagado." };
  }
  revalidateOrder(orderId);
  return { ok: true };
}

/** Cancela el pedido y devuelve el stock reservado. */
export async function cancelarPedido(
  orderId: string
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const cancelled = await cancelOrder(orderId);
  if (!cancelled) {
    return { ok: false, error: "Este pedido no se puede cancelar." };
  }
  revalidateOrder(orderId);
  return { ok: true };
}

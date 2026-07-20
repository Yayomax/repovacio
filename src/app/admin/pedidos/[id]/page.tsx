import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getStoreConfig } from "@/lib/store-config";
import { formatMoney } from "@/lib/money";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { OrderActions } from "@/components/admin/OrderActions";

export const metadata: Metadata = { title: "Detalle de pedido" };

export default async function AdminOrderDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  const [config, order] = await Promise.all([
    getStoreConfig(),
    prisma.order.findUnique({
      where: { id },
      include: { items: true, user: { select: { email: true } } },
    }),
  ]);
  if (!order) notFound();

  const isPendingTransfer =
    order.status === "PENDING" && order.paymentMethod === "TRANSFER";

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/admin/pedidos"
        className="text-sm text-neutral-400 transition-colors hover:text-white"
      >
        ← Volver a pedidos
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {order.code}
            </h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm text-neutral-400">
            {new Intl.DateTimeFormat("es", {
              dateStyle: "long",
              timeStyle: "short",
            }).format(order.createdAt)}
          </p>
        </div>
        <OrderActions
          orderId={order.id}
          status={order.status}
          paymentMethod={order.paymentMethod}
        />
      </div>

      {isPendingTransfer && (
        <div className="card mt-5 border-white/30 bg-white/[0.06] p-5">
          <p className="text-sm leading-relaxed text-neutral-200">
            💡 <strong>Transferencia pendiente:</strong> busca en{" "}
            {config.transferEmail ? (
              <strong>{config.transferEmail}</strong>
            ) : (
              "tu casilla"
            )}{" "}
            un comprobante con el código <strong>{order.code}</strong> por{" "}
            <strong>{formatMoney(order.totalCents, config.currency)}</strong>.
            Si el dinero llegó, presiona “Validar pago recibido”: el cliente
            recibe la confirmación automáticamente.
          </p>
        </div>
      )}

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <section className="card p-5">
          <h2 className="text-xs font-medium uppercase tracking-widest text-neutral-500">
            Cliente
          </h2>
          <div className="mt-3 space-y-1.5 text-sm">
            <p className="font-semibold text-white">{order.name}</p>
            <p>
              <a href={`mailto:${order.email}`} className="link-underline">
                {order.email}
              </a>
            </p>
            {order.phone && <p className="text-neutral-300">{order.phone}</p>}
            {order.address && (
              <p className="text-neutral-300">📍 {order.address}</p>
            )}
            {order.notes && (
              <p className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-neutral-300">
                “{order.notes}”
              </p>
            )}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="text-xs font-medium uppercase tracking-widest text-neutral-500">
            Pago y envío
          </h2>
          <div className="mt-3 space-y-1.5 text-sm text-neutral-300">
            <p>
              Método:{" "}
              <strong className="text-white">
                {order.paymentMethod === "TRANSFER"
                  ? "Transferencia bancaria"
                  : "Mercado Pago"}
              </strong>
            </p>
            {order.mpPaymentId && (
              <p>
                ID de pago MP:{" "}
                <span className="select-all text-white">{order.mpPaymentId}</span>
              </p>
            )}
            {order.paidAt && (
              <p>
                Pagado el{" "}
                {new Intl.DateTimeFormat("es", {
                  dateStyle: "long",
                  timeStyle: "short",
                }).format(order.paidAt)}
              </p>
            )}
            <p>
              Envío:{" "}
              <strong className="text-white">
                {order.shippingName ?? "A coordinar con el cliente"}
              </strong>
              {order.shippingName &&
                ` (${order.shippingCents === 0 ? "gratis" : formatMoney(order.shippingCents, config.currency)})`}
            </p>
          </div>
        </section>
      </div>

      <section className="card mt-5 overflow-hidden">
        <h2 className="border-b border-white/10 px-5 py-4 font-semibold">
          Productos
        </h2>
        <ul className="divide-y divide-white/5">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 px-5 py-3.5">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                {item.imagePath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/uploads/${item.imagePath}`}
                    alt={item.productName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-neutral-600">
                    ◻
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.productName}</p>
                <p className="text-xs text-neutral-400">
                  {item.variantName && item.variantName !== "Único"
                    ? `${item.variantName} · `
                    : ""}
                  {formatMoney(item.unitCents, config.currency)} × {item.quantity}
                </p>
              </div>
              <p className="text-sm font-semibold tabular-nums">
                {formatMoney(item.unitCents * item.quantity, config.currency)}
              </p>
            </li>
          ))}
        </ul>
        <div className="space-y-1.5 border-t border-white/10 px-5 py-4 text-sm">
          <div className="flex justify-between text-neutral-400">
            <span>Subtotal</span>
            <span className="tabular-nums">
              {formatMoney(order.subtotalCents, config.currency)}
            </span>
          </div>
          <div className="flex justify-between text-neutral-400">
            <span>Envío</span>
            <span className="tabular-nums">
              {order.shippingName
                ? formatMoney(order.shippingCents, config.currency)
                : "—"}
            </span>
          </div>
          <div className="flex justify-between pt-1 text-base font-semibold">
            <span>Total</span>
            <span className="tabular-nums">
              {formatMoney(order.totalCents, config.currency)}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

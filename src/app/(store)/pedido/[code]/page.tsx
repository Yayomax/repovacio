import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getStoreConfig } from "@/lib/store-config";
import { verifyMpPayment } from "@/lib/order-service";
import { formatMoney } from "@/lib/money";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";

export const metadata: Metadata = { title: "Tu pedido" };

const STATUS_HERO: Record<
  string,
  { icon: string; title: string; subtitle: string }
> = {
  PENDING: {
    icon: "⏳",
    title: "¡Pedido recibido!",
    subtitle: "Está reservado a tu nombre, esperando el pago.",
  },
  PAID: {
    icon: "✓",
    title: "Pago confirmado",
    subtitle: "Ya estamos preparando tu pedido.",
  },
  FULFILLED: {
    icon: "📦",
    title: "Pedido entregado",
    subtitle: "¡Gracias por tu compra!",
  },
  CANCELLED: {
    icon: "✕",
    title: "Pedido cancelado",
    subtitle: "Este pedido fue cancelado. Si es un error, contáctanos.",
  },
};

export default async function OrderPage(props: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{
    payment_id?: string;
    collection_id?: string;
    mp_error?: string;
  }>;
}) {
  const { code } = await props.params;
  const { payment_id, collection_id, mp_error } = await props.searchParams;

  // Al volver de Mercado Pago verificamos el pago contra su API
  const mpPaymentId = payment_id ?? collection_id;
  if (mpPaymentId) {
    await verifyMpPayment(mpPaymentId);
  }

  const [config, order] = await Promise.all([
    getStoreConfig(),
    prisma.order.findUnique({
      where: { code: code.toUpperCase() },
      include: { items: true },
    }),
  ]);
  if (!order) notFound();

  const hero = STATUS_HERO[order.status];
  const showTransferInstructions =
    order.paymentMethod === "TRANSFER" && order.status === "PENDING";
  const mailtoHref = config.transferEmail
    ? `mailto:${config.transferEmail}?subject=${encodeURIComponent(
        `Comprobante pedido ${order.code}`
      )}&body=${encodeURIComponent(
        `Hola! Adjunto el comprobante de la transferencia por mi pedido ${order.code} (${formatMoney(order.totalCents, config.currency)}).`
      )}`
    : null;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      {/* Estado */}
      <div className="animate-fade-up text-center">
        <span
          className={`mx-auto grid h-20 w-20 place-items-center rounded-full border text-3xl ${
            order.status === "PAID" || order.status === "FULFILLED"
              ? "border-white bg-white text-black"
              : "border-white/15 bg-white/5"
          } ${order.status === "PAID" ? "animate-pulse-ring" : ""}`}
        >
          {hero.icon}
        </span>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight md:text-4xl">
          {hero.title}
        </h1>
        <p className="mt-2 text-neutral-400">{hero.subtitle}</p>
        {mp_error && order.status === "PENDING" && (
          <p className="mx-auto mt-4 max-w-md rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-neutral-300">
            El pago no se completó. Puedes reintentar desde el checkout o
            contactar a la tienda.
          </p>
        )}
        <div className="mt-4 flex items-center justify-center gap-3">
          <span className="badge">Pedido {order.code}</span>
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      {/* Instrucciones de transferencia */}
      {showTransferInstructions && (
        <section className="card mt-8 animate-fade-up p-6 [animation-delay:.15s] md:p-8">
          <h2 className="text-lg font-semibold">
            💳 Cómo completar el pago por transferencia
          </h2>
          <ol className="mt-4 space-y-4 text-sm text-neutral-300">
            <li className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-xs font-bold text-black">
                1
              </span>
              <div className="min-w-0">
                Transfiere{" "}
                <strong className="text-white">
                  {formatMoney(order.totalCents, config.currency)}
                </strong>{" "}
                a la siguiente cuenta:
                <div className="mt-3 space-y-2 rounded-xl border border-white/10 bg-white/[0.04] p-4">
                  {config.transferAlias && (
                    <p>
                      <span className="text-neutral-500">Alias:</span>{" "}
                      <strong className="select-all text-white">
                        {config.transferAlias}
                      </strong>
                    </p>
                  )}
                  {config.transferCbu && (
                    <p>
                      <span className="text-neutral-500">CBU/CVU:</span>{" "}
                      <strong className="select-all text-white">
                        {config.transferCbu}
                      </strong>
                    </p>
                  )}
                  {config.transferHolder && (
                    <p>
                      <span className="text-neutral-500">Titular:</span>{" "}
                      <strong className="text-white">{config.transferHolder}</strong>
                    </p>
                  )}
                </div>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-xs font-bold text-black">
                2
              </span>
              <div>
                Envía el <strong className="text-white">comprobante</strong> junto
                con tu código de pedido{" "}
                <strong className="select-all text-white">{order.code}</strong> a{" "}
                {config.transferEmail ? (
                  <a href={`mailto:${config.transferEmail}`} className="link-underline font-semibold">
                    {config.transferEmail}
                  </a>
                ) : (
                  "el email de la tienda"
                )}
                .
              </div>
            </li>
            <li className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-xs font-bold text-black">
                3
              </span>
              <div>
                Cuando validemos el pago te llega la confirmación por email y el
                estado de esta página se actualiza.
              </div>
            </li>
          </ol>
          {config.transferNotes && (
            <p className="mt-4 text-xs text-neutral-500">{config.transferNotes}</p>
          )}
          {mailtoHref && (
            <a href={mailtoHref} className="btn-solid mt-6 w-full">
              Enviar comprobante por email →
            </a>
          )}
        </section>
      )}

      {/* Detalle */}
      <section className="card mt-6 animate-fade-up p-6 [animation-delay:.25s] md:p-8">
        <h2 className="text-lg font-semibold">Detalle del pedido</h2>
        <ul className="mt-4 divide-y divide-white/5">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 py-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                {item.imagePath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/uploads/${item.imagePath}`}
                    alt={item.productName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-neutral-600">◻</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {item.productName}
                </p>
                <p className="text-xs text-neutral-400">
                  {item.variantName && item.variantName !== "Único"
                    ? `${item.variantName} · `
                    : ""}
                  × {item.quantity}
                </p>
              </div>
              <p className="text-sm font-semibold tabular-nums">
                {formatMoney(item.unitCents * item.quantity, config.currency)}
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-2 space-y-2 border-t border-white/10 pt-4 text-sm">
          <div className="flex justify-between text-neutral-400">
            <span>Subtotal</span>
            <span className="tabular-nums">
              {formatMoney(order.subtotalCents, config.currency)}
            </span>
          </div>
          <div className="flex justify-between text-neutral-400">
            <span>Envío{order.shippingName ? ` · ${order.shippingName}` : ""}</span>
            <span className="tabular-nums">
              {order.shippingName
                ? order.shippingCents === 0
                  ? "Gratis"
                  : formatMoney(order.shippingCents, config.currency)
                : "A coordinar"}
            </span>
          </div>
          <div className="flex justify-between pt-2 text-base font-semibold">
            <span>Total</span>
            <span className="tabular-nums">
              {formatMoney(order.totalCents, config.currency)}
            </span>
          </div>
        </div>
      </section>

      <div className="mt-8 flex animate-fade-up flex-wrap justify-center gap-3 [animation-delay:.35s]">
        <Link href="/catalogo" className="btn-ghost">
          ← Seguir comprando
        </Link>
        <Link href="/mis-pedidos" className="btn-solid">
          Ver mis pedidos
        </Link>
      </div>
    </div>
  );
}

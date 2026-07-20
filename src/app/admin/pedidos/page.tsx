import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getStoreConfig } from "@/lib/store-config";
import { formatMoney } from "@/lib/money";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";

export const metadata: Metadata = { title: "Pedidos" };

const FILTERS: { key: string; label: string; where: Prisma.OrderWhereInput }[] = [
  { key: "todos", label: "Todos", where: {} },
  { key: "pendientes", label: "Por validar", where: { status: "PENDING" } },
  { key: "pagados", label: "Pagados", where: { status: "PAID" } },
  { key: "entregados", label: "Entregados", where: { status: "FULFILLED" } },
  { key: "cancelados", label: "Cancelados", where: { status: "CANCELLED" } },
];

export default async function AdminOrdersPage(props: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await props.searchParams;
  const activeFilter =
    FILTERS.find((filter) => filter.key === estado) ?? FILTERS[0];

  const [config, orders, counts] = await Promise.all([
    getStoreConfig(),
    prisma.order.findMany({
      where: activeFilter.where,
      orderBy: { createdAt: "desc" },
      include: { items: { select: { quantity: true } } },
      take: 100,
    }),
    Promise.all(
      FILTERS.map((filter) => prisma.order.count({ where: filter.where }))
    ),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Pedidos
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          Valida pagos por transferencia, marca entregas y gestiona cancelaciones.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {FILTERS.map((filter, index) => (
          <Link
            key={filter.key}
            href={filter.key === "todos" ? "/admin/pedidos" : `/admin/pedidos?estado=${filter.key}`}
            className={`press rounded-full border px-4 py-1.5 text-sm transition-colors duration-150 ${
              activeFilter.key === filter.key
                ? "border-white bg-white font-semibold text-black"
                : "border-white/15 text-neutral-300 hover:border-white/50"
            }`}
          >
            {filter.label}
            <span
              className={
                activeFilter.key === filter.key
                  ? "ml-1.5 text-neutral-600"
                  : "ml-1.5 text-neutral-500"
              }
            >
              {counts[index]}
            </span>
          </Link>
        ))}
      </div>

      <div className="card mt-5 overflow-hidden">
        {orders.length === 0 ? (
          <p className="px-6 py-14 text-center text-sm text-neutral-500">
            No hay pedidos en esta vista.
          </p>
        ) : (
          <>
            {/* Tarjetas en mobile */}
            <ul className="divide-y divide-white/5 md:hidden">
              {orders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/admin/pedidos/${order.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors duration-150 active:bg-white/[0.06]"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-white">
                          {order.code}
                        </span>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <p className="mt-1 truncate text-xs text-neutral-400">
                        {order.name} ·{" "}
                        {order.paymentMethod === "TRANSFER"
                          ? "Transferencia"
                          : "Mercado Pago"}{" "}
                        ·{" "}
                        {new Intl.DateTimeFormat("es", {
                          day: "2-digit",
                          month: "short",
                        }).format(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-sm font-semibold tabular-nums">
                        {formatMoney(order.totalCents, config.currency)}
                      </span>
                      <span className="text-neutral-600">→</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Tabla en escritorio */}
            <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-widest text-neutral-500">
                  <th className="px-5 py-3.5 font-medium">Pedido</th>
                  <th className="px-5 py-3.5 font-medium">Cliente</th>
                  <th className="px-5 py-3.5 font-medium">Pago</th>
                  <th className="px-5 py-3.5 font-medium">Total</th>
                  <th className="px-5 py-3.5 font-medium">Estado</th>
                  <th className="px-5 py-3.5 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="group relative border-b border-white/5 transition-colors duration-150 last:border-0 hover:bg-white/[0.04]"
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/pedidos/${order.id}`}
                        className="font-semibold text-white after:absolute after:inset-0"
                      >
                        {order.code}
                      </Link>
                    </td>
                    <td className="max-w-44 truncate px-5 py-4 text-neutral-300">
                      {order.name}
                    </td>
                    <td className="px-5 py-4 text-neutral-400">
                      {order.paymentMethod === "TRANSFER"
                        ? "Transferencia"
                        : "Mercado Pago"}
                    </td>
                    <td className="px-5 py-4 font-semibold tabular-nums">
                      {formatMoney(order.totalCents, config.currency)}
                    </td>
                    <td className="px-5 py-4">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-4 text-neutral-400">
                      {new Intl.DateTimeFormat("es", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

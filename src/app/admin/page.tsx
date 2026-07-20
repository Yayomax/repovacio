import type { Metadata } from "next";
import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { getStoreConfig } from "@/lib/store-config";
import { formatMoney } from "@/lib/money";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";

export const metadata: Metadata = { title: "Panel de administración" };

export default async function AdminDashboardPage() {
  const config = await getStoreConfig();

  const [salesAggregate, pendingTransfers, totalOrders, activeProducts, lowStock, recentOrders] =
    await Promise.all([
      prisma.order.aggregate({
        where: { status: { in: ["PAID", "FULFILLED"] } },
        _sum: { totalCents: true },
        _count: true,
      }),
      prisma.order.count({
        where: { status: "PENDING", paymentMethod: "TRANSFER" },
      }),
      prisma.order.count(),
      prisma.product.count({ where: { active: true } }),
      prisma.productVariant.findMany({
        where: { stock: { lte: 3 }, product: { active: true } },
        orderBy: { stock: "asc" },
        take: 5,
        include: { product: { select: { name: true, id: true } } },
      }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { items: { select: { quantity: true } } },
      }),
    ]);

  const stats = [
    {
      label: "Ventas confirmadas",
      value: formatMoney(salesAggregate._sum.totalCents ?? 0, config.currency),
      hint: `${salesAggregate._count} pedidos pagados`,
    },
    {
      label: "Transferencias por validar",
      value: String(pendingTransfers),
      hint: "Esperan tu confirmación",
      href: "/admin/pedidos?estado=pendientes",
      highlight: pendingTransfers > 0,
    },
    {
      label: "Pedidos totales",
      value: String(totalOrders),
      hint: "Historial completo",
      href: "/admin/pedidos",
    },
    {
      label: "Productos activos",
      value: String(activeProducts),
      hint: "Publicados en la tienda",
      href: "/admin/productos",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Hola 👋
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Esto es lo que está pasando en {config.storeName}.
          </p>
        </div>
        <Link href="/admin/productos/nuevo" className="btn-solid">
          + Cargar producto
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const content = (
            <>
              <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">
                {stat.label}
              </p>
              <p
                className={`mt-2 text-2xl font-semibold tabular-nums ${
                  stat.highlight ? "text-white" : ""
                }`}
              >
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-neutral-500">{stat.hint}</p>
            </>
          );
          const className = `card reveal p-5 ${
            stat.highlight ? "border-white/40 bg-white/[0.07]" : ""
          }`;
          return stat.href ? (
            <Link
              key={stat.label}
              href={stat.href}
              className={`${className} transition-colors duration-150 hover:border-white/30`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {content}
            </Link>
          ) : (
            <div
              key={stat.label}
              className={className}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {content}
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr,340px]">
        {/* Últimos pedidos */}
        <section className="card overflow-hidden">
          <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <h2 className="font-semibold">Últimos pedidos</h2>
            <Link
              href="/admin/pedidos"
              className="text-sm text-neutral-400 transition-colors hover:text-white"
            >
              Ver todos →
            </Link>
          </header>
          {recentOrders.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-neutral-500">
              Cuando lleguen pedidos van a aparecer acá.
            </p>
          ) : (
            <ul className="divide-y divide-white/5">
              {recentOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/admin/pedidos/${order.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors duration-150 hover:bg-white/[0.04]"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{order.code}</p>
                      <p className="truncate text-xs text-neutral-400">
                        {order.name} ·{" "}
                        {order.paymentMethod === "TRANSFER"
                          ? "Transferencia"
                          : "Mercado Pago"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-sm font-semibold tabular-nums">
                        {formatMoney(order.totalCents, config.currency)}
                      </span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Stock bajo */}
        <section className="card h-fit overflow-hidden">
          <header className="border-b border-white/10 px-5 py-4">
            <h2 className="font-semibold">⚠ Stock bajo</h2>
          </header>
          {lowStock.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-neutral-500">
              Todo el stock está saludable.
            </p>
          ) : (
            <ul className="divide-y divide-white/5">
              {lowStock.map((variant) => (
                <li key={variant.id}>
                  <Link
                    href={`/admin/productos/${variant.product.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-3 transition-colors duration-150 hover:bg-white/[0.04]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm">{variant.product.name}</p>
                      {variant.name !== "Único" && (
                        <p className="text-xs text-neutral-500">{variant.name}</p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        variant.stock === 0
                          ? "bg-red-400/20 text-red-300"
                          : "bg-white/10 text-neutral-200"
                      }`}
                    >
                      {variant.stock === 0 ? "Agotado" : `${variant.stock} u.`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

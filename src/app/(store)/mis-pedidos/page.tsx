import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";

export const metadata: Metadata = { title: "Mis pedidos" };

export default async function MyOrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="animate-fade-up text-3xl font-semibold tracking-tight md:text-4xl">
        Mis pedidos
      </h1>

      {orders.length === 0 ? (
        <div className="card mt-10 flex animate-fade-up flex-col items-center gap-4 px-6 py-16 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full border border-white/10 bg-white/5 text-2xl">
            📦
          </span>
          <p className="text-lg font-semibold">Todavía no hiciste pedidos</p>
          <p className="text-sm text-neutral-400">
            Cuando compres algo, vas a poder seguirlo desde acá.
          </p>
          <Link href="/catalogo" className="btn-solid mt-2">
            Explorar el catálogo
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {orders.map((order, index) => {
            const itemCount = order.items.reduce(
              (sum, item) => sum + item.quantity,
              0
            );
            return (
              <li
                key={order.id}
                className="reveal"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Link
                  href={`/pedido/${order.code}`}
                  className="card group flex items-center justify-between gap-4 p-5 transition-[transform,border-color] duration-200 [transition-timing-function:var(--ease-out-strong)] hover:-translate-y-0.5 hover:border-white/25"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-white">{order.code}</span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="mt-1 text-sm text-neutral-400">
                      {new Intl.DateTimeFormat("es", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      }).format(order.createdAt)}{" "}
                      · {itemCount} {itemCount === 1 ? "producto" : "productos"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold tabular-nums">
                      {formatMoney(order.totalCents)}
                    </span>
                    <span className="text-neutral-500 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-white">
                      →
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

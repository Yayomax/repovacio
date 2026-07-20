"use client";

import Link from "next/link";

import { useCart } from "@/components/store/CartProvider";
import { QtyStepper } from "@/components/store/QtyStepper";
import { formatMoney } from "@/lib/money";

export default function CartPage() {
  const { items, subtotalCents, setQuantity, removeItem } = useCart();

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-12">
      <h1 className="animate-fade-up text-3xl font-semibold tracking-tight md:text-4xl">
        Tu carrito
      </h1>

      {items.length === 0 ? (
        <div className="card mt-10 flex animate-fade-up flex-col items-center gap-4 px-6 py-16 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full border border-white/10 bg-white/5 text-2xl">
            🛍
          </span>
          <p className="text-lg font-semibold">Está vacío por ahora</p>
          <p className="text-sm text-neutral-400">
            Cuando agregues productos van a aparecer acá.
          </p>
          <Link href="/catalogo" className="btn-solid mt-2">
            Explorar el catálogo
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr,320px]">
          <ul className="space-y-4">
            {items.map((item, index) => (
              <li
                key={item.variantId}
                className="card reveal flex gap-4 p-4"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Link
                  href={`/producto/${item.slug}`}
                  className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5"
                >
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/uploads/${item.image}`}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-2xl text-neutral-600">
                      ◻
                    </div>
                  )}
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/producto/${item.slug}`}
                        className="block truncate font-semibold text-white transition-opacity hover:opacity-80"
                      >
                        {item.name}
                      </Link>
                      {item.variantName !== "Único" && (
                        <p className="text-sm text-neutral-400">
                          {item.variantName}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      aria-label={`Quitar ${item.name}`}
                      onClick={() => removeItem(item.variantId)}
                      className="press text-neutral-500 transition-colors hover:text-red-300"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <QtyStepper
                      value={item.quantity}
                      max={item.maxStock}
                      onChange={(quantity) => setQuantity(item.variantId, quantity)}
                    />
                    <p className="font-semibold tabular-nums">
                      {formatMoney(item.unitCents * item.quantity)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="card h-fit animate-fade-up p-6 [animation-delay:.15s]">
            <h2 className="text-lg font-semibold">Resumen</h2>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-neutral-400">Subtotal</span>
              <span className="text-xl font-semibold tabular-nums">
                {formatMoney(subtotalCents)}
              </span>
            </div>
            <p className="mt-2 text-xs text-neutral-500">
              El envío (si corresponde) se elige en el siguiente paso.
            </p>
            <Link href="/checkout" className="btn-solid mt-5 w-full py-3">
              Finalizar compra →
            </Link>
            <Link href="/catalogo" className="btn-ghost mt-3 w-full">
              Seguir comprando
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}

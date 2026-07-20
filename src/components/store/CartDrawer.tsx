"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/components/store/CartProvider";
import { QtyStepper } from "@/components/store/QtyStepper";
import { formatMoney } from "@/lib/money";

export function CartDrawer() {
  const { items, subtotalCents, isOpen, setOpen, setQuantity, removeItem } =
    useCart();

  // Cerrar con Escape + bloquear el scroll del body mientras está abierto
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, setOpen]);

  return (
    <div
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-50 ${isOpen ? "" : "pointer-events-none"}`}
    >
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Panel (transición interrumpible, curva de drawer iOS) */}
      <aside
        role="dialog"
        aria-label="Carrito de compras"
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#0a0a0a] shadow-2xl transition-transform duration-[400ms] [transition-timing-function:var(--ease-drawer)] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <h2 className="text-lg font-semibold tracking-tight">Tu carrito</h2>
          <button
            type="button"
            aria-label="Cerrar carrito"
            onClick={() => setOpen(false)}
            className="press grid h-9 w-9 place-items-center rounded-full border border-white/15 text-neutral-300 hover:border-white/40 hover:text-white"
          >
            ✕
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full border border-white/10 bg-white/5 text-2xl">
              🛍
            </span>
            <p className="text-neutral-400">Tu carrito está vacío.</p>
            <Link
              href="/catalogo"
              onClick={() => setOpen(false)}
              className="btn-solid"
            >
              Explorar el catálogo
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              {items.map((item) => (
                <li key={item.variantId} className="flex gap-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/uploads/${item.image}`}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-xl text-neutral-600">
                        ◻
                      </div>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">
                          {item.name}
                        </p>
                        {item.variantName !== "Único" && (
                          <p className="text-xs text-neutral-400">
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
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <QtyStepper
                        small
                        value={item.quantity}
                        max={item.maxStock}
                        onChange={(quantity) =>
                          setQuantity(item.variantId, quantity)
                        }
                      />
                      <p className="text-sm font-semibold tabular-nums">
                        {formatMoney(item.unitCents * item.quantity)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="space-y-3 border-t border-white/10 px-6 py-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-400">Subtotal</span>
                <span className="text-lg font-semibold tabular-nums">
                  {formatMoney(subtotalCents)}
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                El costo de envío se define en el checkout.
              </p>
              <Link
                href="/checkout"
                onClick={() => setOpen(false)}
                className="btn-solid w-full"
              >
                Finalizar compra →
              </Link>
              <Link
                href="/carrito"
                onClick={() => setOpen(false)}
                className="btn-ghost w-full"
              >
                Ver carrito completo
              </Link>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}

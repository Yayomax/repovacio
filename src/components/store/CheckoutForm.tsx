"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createOrder } from "@/app/(store)/checkout/actions";
import { useCart } from "@/components/store/CartProvider";
import { Spinner } from "@/components/Spinner";
import { formatMoney } from "@/lib/money";

type ShippingOptionData = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
};

export function CheckoutForm({
  defaults,
  mpAvailable,
  transferAvailable,
  transferEmail,
  shippingOptions,
}: {
  defaults: { name: string; email: string };
  mpAvailable: boolean;
  transferAvailable: boolean;
  transferEmail: string | null;
  shippingOptions: ShippingOptionData[];
}) {
  const router = useRouter();
  const { items, subtotalCents, clear } = useCart();
  const [pending, startTransition] = useTransition();

  const [shippingId, setShippingId] = useState<string>("");
  const [payment, setPayment] = useState<"MERCADOPAGO" | "TRANSFER" | "">(
    mpAvailable ? "MERCADOPAGO" : transferAvailable ? "TRANSFER" : ""
  );

  const shipping = shippingOptions.find((option) => option.id === shippingId);
  const totalCents = subtotalCents + (shipping?.priceCents ?? 0);
  const noPaymentMethods = !mpAvailable && !transferAvailable;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (items.length === 0 || !payment) return;

    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await createOrder({
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        address: String(formData.get("address") ?? ""),
        notes: String(formData.get("notes") ?? ""),
        shippingOptionId: shippingId,
        paymentMethod: payment,
        items: items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      clear();
      if (result.redirectUrl) {
        toast.success("Pedido creado. Te llevamos a Mercado Pago...");
        window.location.href = result.redirectUrl;
      } else {
        router.push(`/pedido/${result.code}`);
      }
    });
  }

  if (items.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-4 px-6 py-16 text-center">
        <p className="text-lg font-semibold">Tu carrito está vacío</p>
        <p className="text-sm text-neutral-400">
          Agrega productos antes de finalizar la compra.
        </p>
        <Link href="/catalogo" className="btn-solid mt-2">
          Ir al catálogo
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr,340px]">
      <div className="space-y-6">
        {/* Datos de contacto */}
        <section className="card p-6">
          <h2 className="text-lg font-semibold">Tus datos</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-xs font-medium uppercase tracking-widest text-neutral-400">
                Nombre y apellido
              </label>
              <input id="name" name="name" required defaultValue={defaults.name} className="field" placeholder="Tu nombre" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-medium uppercase tracking-widest text-neutral-400">
                Email
              </label>
              <input id="email" name="email" type="email" required defaultValue={defaults.email} className="field" placeholder="tu@email.com" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="phone" className="text-xs font-medium uppercase tracking-widest text-neutral-400">
                Teléfono <span className="normal-case text-neutral-600">(opcional)</span>
              </label>
              <input id="phone" name="phone" className="field" placeholder="+54 9 ..." />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="address" className="text-xs font-medium uppercase tracking-widest text-neutral-400">
                Dirección de entrega <span className="normal-case text-neutral-600">(opcional)</span>
              </label>
              <textarea id="address" name="address" rows={2} className="field resize-none" placeholder="Calle, número, ciudad, código postal..." />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="notes" className="text-xs font-medium uppercase tracking-widest text-neutral-400">
                Notas para la tienda <span className="normal-case text-neutral-600">(opcional)</span>
              </label>
              <textarea id="notes" name="notes" rows={2} className="field resize-none" placeholder="Aclaraciones, horarios de entrega..." />
            </div>
          </div>
        </section>

        {/* Envío */}
        <section className="card p-6">
          <h2 className="text-lg font-semibold">Envío</h2>
          <div className="mt-4 space-y-2">
            <label
              className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-colors duration-150 ${
                shippingId === ""
                  ? "border-white bg-white/[0.06]"
                  : "border-white/10 hover:border-white/30"
              }`}
            >
              <span className="flex items-center gap-3">
                <input
                  type="radio"
                  name="shipping"
                  checked={shippingId === ""}
                  onChange={() => setShippingId("")}
                  className="accent-white"
                />
                <span>
                  <span className="block text-sm font-medium">
                    A coordinar con la tienda
                  </span>
                  <span className="block text-xs text-neutral-400">
                    Retiro o entrega a convenir después de la compra.
                  </span>
                </span>
              </span>
              <span className="text-sm text-neutral-400">—</span>
            </label>

            {shippingOptions.map((option) => (
              <label
                key={option.id}
                className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-colors duration-150 ${
                  shippingId === option.id
                    ? "border-white bg-white/[0.06]"
                    : "border-white/10 hover:border-white/30"
                }`}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shipping"
                    checked={shippingId === option.id}
                    onChange={() => setShippingId(option.id)}
                    className="accent-white"
                  />
                  <span>
                    <span className="block text-sm font-medium">{option.name}</span>
                    {option.description && (
                      <span className="block text-xs text-neutral-400">
                        {option.description}
                      </span>
                    )}
                  </span>
                </span>
                <span className="text-sm font-semibold tabular-nums">
                  {option.priceCents === 0 ? "Gratis" : formatMoney(option.priceCents)}
                </span>
              </label>
            ))}
          </div>
        </section>

        {/* Pago */}
        <section className="card p-6">
          <h2 className="text-lg font-semibold">Método de pago</h2>
          {noPaymentMethods ? (
            <p className="mt-4 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-neutral-300">
              ⚠ La tienda todavía no configuró métodos de pago. Vuelve a
              intentarlo más tarde.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {mpAvailable && (
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors duration-150 ${
                    payment === "MERCADOPAGO"
                      ? "border-white bg-white/[0.06]"
                      : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={payment === "MERCADOPAGO"}
                    onChange={() => setPayment("MERCADOPAGO")}
                    className="accent-white"
                  />
                  <span>
                    <span className="block text-sm font-medium">Mercado Pago</span>
                    <span className="block text-xs text-neutral-400">
                      Tarjetas de crédito/débito o dinero en cuenta. Acreditación
                      instantánea.
                    </span>
                  </span>
                </label>
              )}
              {transferAvailable && (
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors duration-150 ${
                    payment === "TRANSFER"
                      ? "border-white bg-white/[0.06]"
                      : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={payment === "TRANSFER"}
                    onChange={() => setPayment("TRANSFER")}
                    className="accent-white"
                  />
                  <span>
                    <span className="block text-sm font-medium">
                      Transferencia bancaria
                    </span>
                    <span className="block text-xs text-neutral-400">
                      Te damos los datos y envías el comprobante
                      {transferEmail ? ` a ${transferEmail}` : ""} con tu código
                      de pedido.
                    </span>
                  </span>
                </label>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Resumen */}
      <aside className="card h-fit p-6 lg:sticky lg:top-24">
        <h2 className="text-lg font-semibold">Resumen</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {items.map((item) => (
            <li key={item.variantId} className="flex justify-between gap-3">
              <span className="min-w-0 truncate text-neutral-300">
                {item.name}
                {item.variantName !== "Único" ? ` (${item.variantName})` : ""} ×{" "}
                {item.quantity}
              </span>
              <span className="tabular-nums">
                {formatMoney(item.unitCents * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-sm">
          <div className="flex justify-between text-neutral-400">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatMoney(subtotalCents)}</span>
          </div>
          <div className="flex justify-between text-neutral-400">
            <span>Envío</span>
            <span className="tabular-nums">
              {shipping
                ? shipping.priceCents === 0
                  ? "Gratis"
                  : formatMoney(shipping.priceCents)
                : "A coordinar"}
            </span>
          </div>
          <div className="flex justify-between pt-2 text-base font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{formatMoney(totalCents)}</span>
          </div>
        </div>
        <button
          type="submit"
          disabled={pending || noPaymentMethods || !payment}
          className="btn-solid mt-5 w-full py-3"
        >
          {pending ? <Spinner /> : null}
          {pending
            ? "Creando pedido..."
            : payment === "MERCADOPAGO"
              ? "Pagar con Mercado Pago →"
              : "Confirmar pedido →"}
        </button>
        <p className="mt-3 text-center text-xs text-neutral-500">
          Al confirmar aceptas ser contactado por la tienda para coordinar tu
          pedido.
        </p>
      </aside>
    </form>
  );
}

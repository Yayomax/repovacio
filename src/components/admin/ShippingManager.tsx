"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  createShippingOption,
  deleteShippingOption,
  toggleShippingOption,
} from "@/app/admin/configuracion/actions";
import { Spinner } from "@/components/Spinner";
import { formatMoney } from "@/lib/money";

type ShippingRow = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  active: boolean;
};

export function ShippingManager({ options }: { options: ShippingRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(
    action: () => Promise<{ ok: boolean; error?: string }>,
    successMessage: string
  ) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(successMessage);
        router.refresh();
      } else {
        toast.error(result.error ?? "No se pudo completar la acción.");
      }
    });
  }

  return (
    <div className="space-y-5">
      <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs leading-relaxed text-neutral-400">
        Las opciones que cargues acá aparecen en el checkout para que el cliente
        elija (con su costo sumado al total). La logística real corre por tu
        cuenta: la tienda no automatiza el envío, solo lo registra en el pedido.
        Si no cargas ninguna, el cliente ve “A coordinar con la tienda”.
      </p>

      {options.length > 0 && (
        <ul className="space-y-2">
          {options.map((option) => (
            <li
              key={option.id}
              className={`card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between ${
                option.active ? "" : "opacity-50"
              }`}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {option.name}{" "}
                  <span className="font-normal text-neutral-400">
                    · {option.priceCents === 0 ? "Gratis" : formatMoney(option.priceCents)}
                  </span>
                </p>
                {option.description && (
                  <p className="truncate text-xs text-neutral-500">
                    {option.description}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2 [&>button]:flex-1 sm:[&>button]:flex-none">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    run(
                      () => toggleShippingOption(option.id),
                      option.active ? "Opción pausada." : "Opción activada."
                    )
                  }
                  className="btn-ghost px-3.5 py-1.5 text-xs"
                >
                  {option.active ? "Pausar" : "Activar"}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (window.confirm(`¿Eliminar "${option.name}"?`)) {
                      run(() => deleteShippingOption(option.id), "Opción eliminada.");
                    }
                  }}
                  className="btn-danger-ghost px-3.5 py-1.5 text-xs"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        className="card grid gap-3 p-4 sm:grid-cols-[1fr,1fr,120px,auto]"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const data = new FormData(form);
          run(
            () =>
              createShippingOption({
                name: String(data.get("name") ?? ""),
                description: String(data.get("description") ?? ""),
                price: String(data.get("price") ?? ""),
              }),
            "Opción de envío creada."
          );
          form.reset();
        }}
      >
        <input
          name="name"
          required
          placeholder="Nombre (ej: Envío CABA)"
          className="field py-2 text-sm"
        />
        <input
          name="description"
          placeholder="Descripción (ej: 24-48 hs)"
          className="field py-2 text-sm"
        />
        <input
          name="price"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          placeholder="Precio"
          className="field py-2 text-sm"
        />
        <button type="submit" disabled={pending} className="btn-solid px-5 py-2 text-sm">
          {pending ? <Spinner /> : "+ Agregar"}
        </button>
      </form>
    </div>
  );
}

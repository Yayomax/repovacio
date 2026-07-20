"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  cancelarPedido,
  confirmarPago,
  marcarEntregado,
} from "@/app/admin/pedidos/actions";
import { Spinner } from "@/components/Spinner";
import type { OrderStatus, PaymentMethod } from "@prisma/client";

export function OrderActions({
  orderId,
  status,
  paymentMethod,
}: {
  orderId: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(
    action: (id: string) => Promise<{ ok: boolean; error?: string }>,
    successMessage: string
  ) {
    startTransition(async () => {
      const result = await action(orderId);
      if (result.ok) {
        toast.success(successMessage);
        router.refresh();
      } else {
        toast.error(result.error ?? "No se pudo completar la acción.");
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-3">
      {status === "PENDING" && (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            run(
              confirmarPago,
              "Pago confirmado. Se envió el email al cliente."
            )
          }
          className="btn-solid"
        >
          {pending ? <Spinner /> : "✓"}{" "}
          {paymentMethod === "TRANSFER"
            ? "Validar pago recibido"
            : "Marcar como pagado"}
        </button>
      )}

      {status === "PAID" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(marcarEntregado, "Pedido marcado como entregado.")}
          className="btn-solid"
        >
          {pending ? <Spinner /> : "📦"} Marcar entregado
        </button>
      )}

      {(status === "PENDING" || status === "PAID") && (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (
              window.confirm(
                "¿Cancelar este pedido? El stock reservado vuelve al catálogo."
              )
            ) {
              run(cancelarPedido, "Pedido cancelado y stock repuesto.");
            }
          }}
          className="btn-danger-ghost"
        >
          Cancelar pedido
        </button>
      )}
    </div>
  );
}

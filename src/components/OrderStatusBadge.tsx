import type { OrderStatus } from "@prisma/client";

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; className: string; dot: string }
> = {
  PENDING: {
    label: "Esperando pago",
    className: "border border-white/20 text-neutral-200",
    dot: "bg-amber-300/90",
  },
  PAID: {
    label: "Pagado",
    className: "bg-white text-black font-semibold",
    dot: "bg-emerald-500",
  },
  FULFILLED: {
    label: "Entregado",
    className: "border border-white/20 text-neutral-200",
    dot: "bg-emerald-400/80",
  },
  CANCELLED: {
    label: "Cancelado",
    className: "border border-white/10 text-neutral-500",
    dot: "bg-red-400/70",
  },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${config.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

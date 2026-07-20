"use client";

import { useCart } from "@/components/store/CartProvider";

export function CartButton() {
  const { count, setOpen } = useCart();

  return (
    <button
      type="button"
      aria-label={`Abrir carrito (${count} productos)`}
      onClick={() => setOpen(true)}
      className="press relative grid h-10 w-10 place-items-center rounded-full border border-white/15 text-white transition-colors duration-150 hover:border-white/40"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 grid h-5 min-w-5 animate-scale-in place-items-center rounded-full bg-white px-1 text-[11px] font-bold text-black">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}

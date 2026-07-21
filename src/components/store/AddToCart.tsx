"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useCart } from "@/components/store/CartProvider";
import { QtyStepper } from "@/components/store/QtyStepper";
import { formatMoney } from "@/lib/money";
import { DEFAULT_SIZE_NAME } from "@/lib/product-options";

type SizeData = {
  id: string;
  name: string;
  stock: number;
};

export function AddToCart({
  product,
  sizes,
}: {
  product: {
    id: string;
    slug: string;
    name: string;
    priceCents: number;
    image: string | null;
  };
  sizes: SizeData[];
}) {
  const { addItem } = useCart();

  // El producto maneja talles si hay más de una fila o la única no es "Único".
  const hasSizes =
    sizes.length > 1 ||
    (sizes.length === 1 && sizes[0].name !== DEFAULT_SIZE_NAME);

  const initialId = useMemo(() => {
    const withStock = sizes.find((size) => size.stock > 0);
    return (withStock ?? sizes[0])?.id ?? null;
  }, [sizes]);

  const [selectedId, setSelectedId] = useState<string | null>(initialId);
  const [quantity, setQuantity] = useState(1);

  const selected = sizes.find((size) => size.id === selectedId) ?? null;
  const stock = selected?.stock ?? 0;
  const canBuy = selected !== null && stock > 0;

  function handleAdd() {
    if (!selected || stock <= 0) return;
    addItem(
      {
        variantId: selected.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        variantName: selected.name,
        unitCents: product.priceCents,
        image: product.image,
        maxStock: stock,
      },
      quantity
    );
    toast.success("Agregado al carrito", {
      description: hasSizes
        ? `${product.name} (${selected.name}) × ${quantity}`
        : `${product.name} × ${quantity}`,
    });
    setQuantity(1);
  }

  return (
    <div className="space-y-6">
      <p className="text-3xl font-semibold tabular-nums">
        {formatMoney(product.priceCents)}
      </p>

      {hasSizes && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-neutral-400">
            Talle
          </p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const isSelected = size.id === selectedId;
              const disabled = size.stock <= 0;
              return (
                <button
                  key={size.id}
                  type="button"
                  disabled={disabled && !isSelected}
                  onClick={() => {
                    setSelectedId(size.id);
                    setQuantity(1);
                  }}
                  className={`press rounded-full border px-4 py-2 text-sm transition-colors duration-150 ${
                    isSelected
                      ? "border-white bg-white font-semibold text-black"
                      : disabled
                        ? "border-white/10 text-neutral-600 line-through"
                        : "border-white/20 text-white hover:border-white/60"
                  }`}
                >
                  {size.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <QtyStepper
          value={quantity}
          max={Math.max(stock, 1)}
          onChange={setQuantity}
        />
        {canBuy && stock <= 5 && (
          <span className="text-sm text-neutral-400">
            {stock === 1 ? "¡Última unidad!" : `Últimas ${stock} unidades`}
          </span>
        )}
      </div>

      <button
        type="button"
        disabled={!canBuy}
        onClick={handleAdd}
        className="btn-solid w-full py-3.5 text-base"
      >
        {canBuy ? "Agregar al carrito" : "Sin stock"}
      </button>
    </div>
  );
}

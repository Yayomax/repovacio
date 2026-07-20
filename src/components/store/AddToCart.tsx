"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useCart } from "@/components/store/CartProvider";
import { QtyStepper } from "@/components/store/QtyStepper";
import { formatMoney } from "@/lib/money";
import { optionsKey, type ProductOptions } from "@/lib/product-options";

type VariantData = {
  id: string;
  name: string;
  optionsKey: string;
  priceCents: number | null;
  stock: number;
};

export function AddToCart({
  product,
  options,
  variants,
}: {
  product: {
    id: string;
    slug: string;
    name: string;
    priceCents: number;
    image: string | null;
  };
  options: ProductOptions;
  variants: VariantData[];
}) {
  const { addItem } = useCart();

  // Preselecciona la primera combinación con stock
  const initialSelection = useMemo(() => {
    const target = variants.find((variant) => variant.stock > 0) ?? variants[0];
    const selection: Record<string, string> = {};
    if (!target) return selection;

    const targetValues = new Map(
      target.optionsKey
        .split("|")
        .filter(Boolean)
        .map((part) => part.split("=") as [string, string])
    );
    for (const option of options) {
      const match = option.values.find(
        (value) =>
          targetValues.get(option.name.trim().toLowerCase()) ===
          value.trim().toLowerCase()
      );
      selection[option.name] = match ?? option.values[0];
    }
    return selection;
  }, [options, variants]);

  const [selection, setSelection] = useState<Record<string, string>>(initialSelection);
  const [quantity, setQuantity] = useState(1);

  const selectedVariant = useMemo(() => {
    if (options.length === 0) return variants[0] ?? null;
    const key = optionsKey(selection);
    return variants.find((variant) => variant.optionsKey === key) ?? null;
  }, [options.length, selection, variants]);

  const priceCents = selectedVariant?.priceCents ?? product.priceCents;
  const stock = selectedVariant?.stock ?? 0;
  const canBuy = selectedVariant !== null && stock > 0;

  function handleAdd() {
    if (!selectedVariant || stock <= 0) return;
    addItem(
      {
        variantId: selectedVariant.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        variantName: selectedVariant.name,
        unitCents: priceCents,
        image: product.image,
        maxStock: stock,
      },
      quantity
    );
    toast.success("Agregado al carrito", {
      description:
        selectedVariant.name !== "Único"
          ? `${product.name} (${selectedVariant.name}) × ${quantity}`
          : `${product.name} × ${quantity}`,
    });
    setQuantity(1);
  }

  return (
    <div className="space-y-6">
      <p className="text-3xl font-semibold tabular-nums">
        {formatMoney(priceCents)}
      </p>

      {options.map((option) => (
        <div key={option.name}>
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-neutral-400">
            {option.name}
          </p>
          <div className="flex flex-wrap gap-2">
            {option.values.map((value) => {
              const isSelected = selection[option.name] === value;
              const wouldBeKey = optionsKey({ ...selection, [option.name]: value });
              const wouldBeVariant = variants.find(
                (variant) => variant.optionsKey === wouldBeKey
              );
              const disabled = !wouldBeVariant || wouldBeVariant.stock <= 0;

              return (
                <button
                  key={value}
                  type="button"
                  disabled={disabled && !isSelected}
                  onClick={() => {
                    setSelection((current) => ({
                      ...current,
                      [option.name]: value,
                    }));
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
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

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

import Link from "next/link";
import { formatMoney } from "@/lib/money";

export type ProductCardData = {
  slug: string;
  name: string;
  priceCents: number;
  compareAtCents: number | null;
  image: string | null;
  inStock: boolean;
};

export function ProductCard({
  product,
  index = 0,
}: {
  product: ProductCardData;
  index?: number;
}) {
  return (
    <Link
      href={`/producto/${product.slug}`}
      className="group card reveal overflow-hidden transition-[transform,border-color] duration-200 [transition-timing-function:var(--ease-out-strong)] hover:-translate-y-1 hover:border-white/25"
      style={{ animationDelay: `${Math.min(index * 50, 400)}ms` }}
    >
      <div className="relative aspect-square overflow-hidden bg-white/[0.04]">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/uploads/${product.image}`}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 [transition-timing-function:var(--ease-out-strong)] group-hover:scale-[1.05]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-4xl text-neutral-700">
            ◻
          </div>
        )}

        {!product.inStock && (
          <span className="absolute left-3 top-3 rounded-full bg-black/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-neutral-300 backdrop-blur">
            Sin stock
          </span>
        )}
        {product.inStock &&
          product.compareAtCents !== null &&
          product.compareAtCents > product.priceCents && (
            <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-black">
              Oferta
            </span>
          )}
      </div>

      <div className="p-4">
        <h3 className="truncate text-sm font-semibold text-white">
          {product.name}
        </h3>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="font-semibold tabular-nums">
            {formatMoney(product.priceCents)}
          </span>
          {product.compareAtCents !== null &&
            product.compareAtCents > product.priceCents && (
              <span className="text-sm text-neutral-500 line-through tabular-nums">
                {formatMoney(product.compareAtCents)}
              </span>
            )}
        </div>
      </div>
    </Link>
  );
}

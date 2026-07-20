import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { fromCents } from "@/lib/money";
import { parseProductOptions } from "@/lib/product-options";
import {
  ProductForm,
  type ProductFormInitial,
} from "@/components/admin/ProductForm";

export const metadata: Metadata = { title: "Editar producto" };

export default async function EditProductPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  const [categories, product] = await Promise.all([
    prisma.category.findMany({
      orderBy: { position: "asc" },
      select: { id: true, name: true },
    }),
    prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { position: "asc" } },
        categories: { select: { id: true } },
        variants: true,
      },
    }),
  ]);
  if (!product) notFound();

  const initial: ProductFormInitial = {
    id: product.id,
    name: product.name,
    description: product.description ?? "",
    price: String(fromCents(product.priceCents)),
    compareAt:
      product.compareAtCents !== null
        ? String(fromCents(product.compareAtCents))
        : "",
    active: product.active,
    featured: product.featured,
    categoryIds: product.categories.map((category) => category.id),
    images: product.images.map((image) => ({ path: image.path, alt: image.alt })),
    options: parseProductOptions(product.options),
    variants: Object.fromEntries(
      product.variants.map((variant) => [
        variant.optionsKey,
        {
          stock: String(variant.stock),
          price:
            variant.priceCents !== null
              ? String(fromCents(variant.priceCents))
              : "",
          sku: variant.sku ?? "",
        },
      ])
    ),
  };

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/admin/productos"
        className="text-sm text-neutral-400 transition-colors hover:text-white"
      >
        ← Volver a productos
      </Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {product.name}
        </h1>
        <Link
          href={`/producto/${product.slug}`}
          className="btn-ghost px-4 py-2 text-xs"
        >
          Ver en la tienda →
        </Link>
      </div>

      <div className="mt-6">
        <ProductForm categories={categories} initial={initial} />
      </div>
    </div>
  );
}

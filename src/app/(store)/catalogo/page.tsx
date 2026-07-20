import type { Metadata } from "next";
import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/store/ProductCard";

export const metadata: Metadata = { title: "Catálogo" };

export default async function CatalogPage(props: {
  searchParams: Promise<{ categoria?: string; q?: string }>;
}) {
  const { categoria, q } = await props.searchParams;
  const query = q?.trim() ?? "";

  const [categories, products] = await Promise.all([
    prisma.category.findMany({ orderBy: { position: "asc" } }),
    prisma.product.findMany({
      where: {
        active: true,
        ...(categoria ? { categories: { some: { slug: categoria } } } : {}),
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      include: {
        images: { orderBy: { position: "asc" }, take: 1 },
        variants: { select: { stock: true } },
      },
    }),
  ]);

  const activeCategory = categories.find((c) => c.slug === categoria);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="animate-fade-up">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {activeCategory ? activeCategory.name : "Catálogo"}
        </h1>
        <p className="mt-2 text-neutral-400">
          {products.length}{" "}
          {products.length === 1 ? "producto disponible" : "productos disponibles"}
        </p>
      </div>

      {/* Búsqueda + filtros */}
      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/catalogo"
            className={`press rounded-full border px-4 py-1.5 text-sm transition-colors duration-150 ${
              !categoria
                ? "border-white bg-white font-semibold text-black"
                : "border-white/15 text-neutral-300 hover:border-white/50"
            }`}
          >
            Todo
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/catalogo?categoria=${category.slug}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
              className={`press rounded-full border px-4 py-1.5 text-sm transition-colors duration-150 ${
                categoria === category.slug
                  ? "border-white bg-white font-semibold text-black"
                  : "border-white/15 text-neutral-300 hover:border-white/50"
              }`}
            >
              {category.name}
            </Link>
          ))}
        </div>

        <form method="GET" action="/catalogo" className="relative md:w-72">
          {categoria && <input type="hidden" name="categoria" value={categoria} />}
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Buscar productos..."
            className="field py-2.5 pr-10"
          />
          <button
            type="submit"
            aria-label="Buscar"
            className="press absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-neutral-400 hover:text-white"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>
        </form>
      </div>

      {/* Grilla */}
      {products.length === 0 ? (
        <div className="card mt-10 flex flex-col items-center gap-3 px-6 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full border border-white/10 bg-white/5 text-xl">
            🔍
          </span>
          <p className="font-semibold">No encontramos productos</p>
          <p className="text-sm text-neutral-400">
            {query
              ? `No hay resultados para "${query}".`
              : "Esta categoría todavía no tiene productos."}
          </p>
          <Link href="/catalogo" className="btn-ghost mt-2">
            Ver todo el catálogo
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              index={index}
              product={{
                slug: product.slug,
                name: product.name,
                priceCents: product.priceCents,
                compareAtCents: product.compareAtCents,
                image: product.images[0]?.path ?? null,
                inStock: product.variants.some((v) => v.stock > 0),
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

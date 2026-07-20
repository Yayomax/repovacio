import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { getStoreConfig } from "@/lib/store-config";
import { ProductCard } from "@/components/store/ProductCard";

export default async function HomePage() {
  const config = await getStoreConfig();

  const [categories, featured] = await Promise.all([
    prisma.category.findMany({
      orderBy: { position: "asc" },
      where: { products: { some: { active: true } } },
    }),
    prisma.product.findMany({
      where: { active: true },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 8,
      include: {
        images: { orderBy: { position: "asc" }, take: 1 },
        variants: { select: { stock: true } },
      },
    }),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-6">
      {/* Hero */}
      <section className="flex flex-col items-center py-20 text-center md:py-28">
        <span className="badge animate-fade-up">● Tienda online</span>
        <h1 className="mt-6 max-w-3xl animate-fade-up text-5xl font-semibold leading-[1.05] tracking-tight [animation-delay:.1s] md:text-7xl">
          <span className="text-shimmer">{config.storeName}</span>
        </h1>
        <p className="mt-5 max-w-xl animate-fade-up text-lg text-neutral-400 [animation-delay:.2s]">
          {config.tagline ??
            "Productos seleccionados, pagos seguros y atención directa."}
        </p>
        <div className="mt-9 flex animate-fade-up flex-wrap justify-center gap-4 [animation-delay:.3s]">
          <Link href="/catalogo" className="btn-solid px-8 py-3 text-base">
            Ver catálogo →
          </Link>
        </div>
      </section>

      {/* Categorías */}
      {categories.length > 0 && (
        <section className="pb-4">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {categories.map((category, index) => (
              <Link
                key={category.id}
                href={`/catalogo?categoria=${category.slug}`}
                className="press reveal rounded-full border border-white/15 px-5 py-2 text-sm text-neutral-200 transition-colors duration-150 hover:border-white/50 hover:text-white"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {category.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Destacados */}
      <section className="py-14">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">
            {featured.some((p) => p.featured) ? "Destacados" : "Novedades"}
          </h2>
          <Link
            href="/catalogo"
            className="link-underline text-sm text-neutral-400"
          >
            Ver todo →
          </Link>
        </div>

        {featured.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full border border-white/10 bg-white/5 text-2xl">
              🏗
            </span>
            <p className="text-lg font-semibold">La tienda está en preparación</p>
            <p className="max-w-sm text-sm text-neutral-400">
              Todavía no hay productos publicados. Muy pronto vas a encontrar el
              catálogo completo acá.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {featured.map((product, index) => (
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
      </section>
    </div>
  );
}

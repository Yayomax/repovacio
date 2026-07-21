import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import {
  getStoreConfig,
  mpConfigured,
  transferConfigured,
} from "@/lib/store-config";
import { AddToCart } from "@/components/store/AddToCart";
import { ProductCard } from "@/components/store/ProductCard";
import { ProductGallery } from "@/components/store/ProductGallery";

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { name: true },
  });
  return { title: product?.name ?? "Producto" };
}

export default async function ProductPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;

  const [config, product] = await Promise.all([
    getStoreConfig(),
    prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { position: "asc" } },
        categories: true,
        variants: { orderBy: { name: "asc" } },
      },
    }),
  ]);

  if (!product || !product.active) notFound();

  const relatedCategoryIds = product.categories.map((c) => c.id);
  const related =
    relatedCategoryIds.length > 0
      ? await prisma.product.findMany({
          where: {
            active: true,
            id: { not: product.id },
            categories: { some: { id: { in: relatedCategoryIds } } },
          },
          take: 4,
          include: {
            images: { orderBy: { position: "asc" }, take: 1 },
            variants: { select: { stock: true } },
          },
        })
      : [];

  const paymentMethods = [
    mpConfigured(config) ? "Mercado Pago (tarjetas, dinero en cuenta)" : null,
    transferConfigured(config) ? "Transferencia bancaria" : null,
  ].filter(Boolean);

  const shippingOptions = await prisma.shippingOption.findMany({
    where: { active: true },
    orderBy: { position: "asc" },
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <nav className="animate-fade-in text-sm text-neutral-500">
        <Link href="/catalogo" className="transition-colors hover:text-white">
          Catálogo
        </Link>
        {product.categories[0] && (
          <>
            {" / "}
            <Link
              href={`/catalogo?categoria=${product.categories[0].slug}`}
              className="transition-colors hover:text-white"
            >
              {product.categories[0].name}
            </Link>
          </>
        )}
        {" / "}
        <span className="text-neutral-300">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div className="animate-fade-up">
          <ProductGallery
            images={product.images.map((image) => ({
              path: image.path,
              alt: image.alt,
            }))}
            name={product.name}
          />
        </div>

        <div className="animate-fade-up [animation-delay:.1s]">
          {product.categories.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {product.categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/catalogo?categoria=${category.slug}`}
                  className="rounded-full border border-white/15 px-3 py-1 text-xs uppercase tracking-widest text-neutral-400 transition-colors hover:border-white/40 hover:text-white"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          )}

          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            {product.name}
          </h1>

          <div className="mt-6">
            <AddToCart
              product={{
                id: product.id,
                slug: product.slug,
                name: product.name,
                priceCents: product.priceCents,
                image: product.images[0]?.path ?? null,
              }}
              sizes={product.variants.map((variant) => ({
                id: variant.id,
                name: variant.name,
                stock: variant.stock,
              }))}
            />
          </div>

          {product.description && (
            <div className="mt-8 border-t border-white/10 pt-6">
              <h2 className="mb-2 text-xs font-medium uppercase tracking-widest text-neutral-400">
                Descripción
              </h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-300">
                {product.description}
              </p>
            </div>
          )}

          <div className="mt-6 space-y-3">
            {paymentMethods.length > 0 && (
              <div className="card p-4">
                <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
                  Medios de pago
                </p>
                <ul className="mt-2 space-y-1 text-sm text-neutral-300">
                  {paymentMethods.map((method) => (
                    <li key={method}>· {method}</li>
                  ))}
                </ul>
              </div>
            )}
            {shippingOptions.length > 0 && (
              <div className="card p-4">
                <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
                  Envíos
                </p>
                <ul className="mt-2 space-y-1 text-sm text-neutral-300">
                  {shippingOptions.map((option) => (
                    <li key={option.id}>· {option.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 text-2xl font-semibold tracking-tight">
            También te puede interesar
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((relatedProduct, index) => (
              <ProductCard
                key={relatedProduct.id}
                index={index}
                product={{
                  slug: relatedProduct.slug,
                  name: relatedProduct.name,
                  priceCents: relatedProduct.priceCents,
                  compareAtCents: relatedProduct.compareAtCents,
                  image: relatedProduct.images[0]?.path ?? null,
                  inStock: relatedProduct.variants.some((v) => v.stock > 0),
                }}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

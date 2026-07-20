import type { Metadata } from "next";
import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { getStoreConfig } from "@/lib/store-config";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = { title: "Productos" };

export default async function AdminProductsPage() {
  const [config, products] = await Promise.all([
    getStoreConfig(),
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        images: { orderBy: { position: "asc" }, take: 1 },
        categories: true,
        variants: { select: { stock: true } },
      },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Productos
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            {products.length}{" "}
            {products.length === 1 ? "producto cargado" : "productos cargados"}
          </p>
        </div>
        <Link href="/admin/productos/nuevo" className="btn-solid">
          + Cargar producto
        </Link>
      </div>

      <div className="card mt-6 overflow-hidden">
        {products.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full border border-white/10 bg-white/5 text-xl">
              📦
            </span>
            <p className="font-semibold">Todavía no hay productos</p>
            <p className="max-w-sm text-sm text-neutral-400">
              Carga el primero: podés crear las categorías y variantes en el
              mismo formulario.
            </p>
            <Link href="/admin/productos/nuevo" className="btn-solid mt-2">
              Cargar mi primer producto
            </Link>
          </div>
        ) : (
          <>
            {/* Tarjetas en mobile */}
            <ul className="divide-y divide-white/5 md:hidden">
              {products.map((product) => {
                const totalStock = product.variants.reduce(
                  (sum, variant) => sum + variant.stock,
                  0
                );
                return (
                  <li key={product.id}>
                    <Link
                      href={`/admin/productos/${product.id}`}
                      className="flex items-center gap-3 px-4 py-3.5 transition-colors duration-150 active:bg-white/[0.06]"
                    >
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                        {product.images[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`/uploads/${product.images[0].path}`}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-neutral-600">
                            ◻
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">
                          {product.featured && (
                            <span className="mr-1" title="Destacado">
                              ★
                            </span>
                          )}
                          {product.name}
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-neutral-400">
                          <span className="font-semibold tabular-nums text-neutral-200">
                            {formatMoney(product.priceCents, config.currency)}
                          </span>
                          <span
                            className={
                              totalStock === 0
                                ? "text-red-300"
                                : totalStock <= 3
                                  ? "text-neutral-200"
                                  : ""
                            }
                          >
                            {totalStock} u.
                          </span>
                          {!product.active && <span>· Borrador</span>}
                        </p>
                      </div>
                      <span className="shrink-0 text-neutral-600">→</span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Tabla en escritorio */}
            <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-widest text-neutral-500">
                  <th className="px-5 py-3.5 font-medium">Producto</th>
                  <th className="px-5 py-3.5 font-medium">Precio</th>
                  <th className="px-5 py-3.5 font-medium">Stock</th>
                  <th className="px-5 py-3.5 font-medium">Categorías</th>
                  <th className="px-5 py-3.5 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const totalStock = product.variants.reduce(
                    (sum, variant) => sum + variant.stock,
                    0
                  );
                  return (
                    <tr
                      key={product.id}
                      className="group relative border-b border-white/5 transition-colors duration-150 last:border-0 hover:bg-white/[0.04]"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                            {product.images[0] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={`/uploads/${product.images[0].path}`}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="grid h-full w-full place-items-center text-neutral-600">
                                ◻
                              </div>
                            )}
                          </div>
                          <Link
                            href={`/admin/productos/${product.id}`}
                            className="font-medium text-white after:absolute after:inset-0"
                          >
                            {product.featured && (
                              <span className="mr-1.5" title="Destacado">
                                ★
                              </span>
                            )}
                            {product.name}
                          </Link>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-semibold tabular-nums">
                        {formatMoney(product.priceCents, config.currency)}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            totalStock === 0
                              ? "bg-red-400/20 text-red-300"
                              : totalStock <= 3
                                ? "bg-white/10 text-neutral-200"
                                : "text-neutral-300"
                          }`}
                        >
                          {totalStock} u.
                        </span>
                      </td>
                      <td className="max-w-48 truncate px-5 py-3 text-neutral-400">
                        {product.categories.map((c) => c.name).join(", ") || "—"}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs ${
                            product.active
                              ? "bg-white font-semibold text-black"
                              : "border border-white/20 text-neutral-400"
                          }`}
                        >
                          {product.active ? "Publicado" : "Borrador"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

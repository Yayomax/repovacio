import type { Metadata } from "next";
import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata: Metadata = { title: "Nuevo producto" };

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({
    orderBy: { position: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/admin/productos"
        className="text-sm text-neutral-400 transition-colors hover:text-white"
      >
        ← Volver a productos
      </Link>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
        Nuevo producto
      </h1>
      <p className="mt-1 text-sm text-neutral-400">
        Nombre, precio, fotos, categorías y variantes: todo en un solo lugar.
      </p>

      <div className="mt-6">
        <ProductForm categories={categories} />
      </div>
    </div>
  );
}

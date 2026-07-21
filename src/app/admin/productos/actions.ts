"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deleteUpload } from "@/lib/uploads";
import { DEFAULT_SIZE_NAME, sizeKey, slugify } from "@/lib/product-options";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("No autorizado.");
}

function revalidateStore(slug?: string) {
  revalidatePath("/");
  revalidatePath("/catalogo");
  if (slug) revalidatePath(`/producto/${slug}`);
  revalidatePath("/admin/productos");
  revalidatePath("/admin");
}

// ── Productos ────────────────────────────────────────────────

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "El nombre es muy corto.").max(120),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  priceCents: z.number().int().min(0, "El precio no puede ser negativo."),
  compareAtCents: z.number().int().min(0).nullable(),
  active: z.boolean(),
  featured: z.boolean(),
  categoryIds: z.array(z.string()).max(20),
  images: z
    .array(z.object({ path: z.string().min(1), alt: z.string().nullable() }))
    .max(12, "Máximo 12 imágenes por producto."),
  // Stock cuando el producto NO maneja talles (una sola existencia).
  stock: z.number().int().min(0).max(1_000_000),
  // Talles con su stock. Vacío = producto sin talles (usa `stock`).
  sizes: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Cada talle necesita un nombre.").max(40),
        stock: z.number().int().min(0).max(1_000_000),
      })
    )
    .max(50, "Máximo 50 talles por producto."),
});

export type ProductInput = z.infer<typeof productSchema>;

/** Convierte los talles del formulario en filas de ProductVariant. */
function buildVariantRows(data: ProductInput) {
  if (data.sizes.length === 0) {
    return [
      {
        name: DEFAULT_SIZE_NAME,
        optionsKey: "default",
        stock: data.stock,
        priceCents: null,
        sku: null,
      },
    ];
  }

  const rows: {
    name: string;
    optionsKey: string;
    stock: number;
    priceCents: null;
    sku: null;
  }[] = [];
  const seen = new Set<string>();
  for (const size of data.sizes) {
    const key = sizeKey(size.name);
    if (seen.has(key)) {
      throw new Error(`El talle "${size.name}" está repetido.`);
    }
    seen.add(key);
    rows.push({
      name: size.name.trim(),
      optionsKey: key,
      stock: size.stock,
      priceCents: null,
      sku: null,
    });
  }
  return rows;
}

async function uniqueSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name) || "producto";
  let candidate = base;
  let suffix = 2;
  // Busca un slug libre agregando sufijos numéricos
  while (true) {
    const existing = await prisma.product.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

export async function saveProduct(
  input: ProductInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  await requireAdmin();

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    };
  }
  const data = parsed.data;

  let finalVariants;
  try {
    finalVariants = buildVariantRows(data);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Talles inválidos.",
    };
  }

  const baseData = {
    name: data.name,
    description: data.description || null,
    priceCents: data.priceCents,
    compareAtCents: data.compareAtCents,
    active: data.active,
    featured: data.featured,
  };

  try {
    if (!data.id) {
      const slug = await uniqueSlug(data.name);
      const product = await prisma.product.create({
        data: {
          ...baseData,
          slug,
          categories: { connect: data.categoryIds.map((id) => ({ id })) },
          images: {
            create: data.images.map((image, position) => ({
              path: image.path,
              alt: image.alt,
              position,
            })),
          },
          variants: { create: finalVariants },
        },
      });
      revalidateStore(slug);
      return { ok: true, id: product.id };
    }

    // ── Edición ──
    const existing = await prisma.product.findUnique({
      where: { id: data.id },
      include: { images: true, variants: true },
    });
    if (!existing) return { ok: false, error: "El producto no existe." };

    const slug =
      slugify(data.name) === slugify(existing.name)
        ? existing.slug
        : await uniqueSlug(data.name, existing.id);

    const newPaths = new Set(data.images.map((image) => image.path));
    const removedImages = existing.images.filter(
      (image) => !newPaths.has(image.path)
    );

    const keptKeys = new Set(finalVariants.map((variant) => variant.optionsKey));
    const removedVariants = existing.variants.filter(
      (variant) => !keptKeys.has(variant.optionsKey)
    );

    await prisma.$transaction([
      prisma.product.update({
        where: { id: existing.id },
        data: {
          ...baseData,
          slug,
          categories: { set: data.categoryIds.map((id) => ({ id })) },
        },
      }),
      prisma.productImage.deleteMany({ where: { productId: existing.id } }),
      prisma.productImage.createMany({
        data: data.images.map((image, position) => ({
          productId: existing.id,
          path: image.path,
          alt: image.alt,
          position,
        })),
      }),
      ...removedVariants.map((variant) =>
        prisma.productVariant.delete({ where: { id: variant.id } })
      ),
      ...finalVariants.map((variant) =>
        prisma.productVariant.upsert({
          where: {
            productId_optionsKey: {
              productId: existing.id,
              optionsKey: variant.optionsKey,
            },
          },
          create: { ...variant, productId: existing.id },
          update: {
            name: variant.name,
            stock: variant.stock,
            priceCents: variant.priceCents,
            sku: variant.sku,
          },
        })
      ),
    ]);

    // Limpieza de archivos de imágenes quitadas (fuera de la transacción)
    await Promise.all(removedImages.map((image) => deleteUpload(image.path)));

    revalidateStore(slug);
    if (slug !== existing.slug) revalidatePath(`/producto/${existing.slug}`);
    return { ok: true, id: existing.id };
  } catch (error) {
    console.error("Error guardando producto:", error);
    return { ok: false, error: "No se pudo guardar el producto." };
  }
}

export async function deleteProduct(
  productId: string
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { images: true },
  });
  if (!product) return { ok: false, error: "El producto no existe." };

  await prisma.product.delete({ where: { id: productId } });
  await Promise.all(product.images.map((image) => deleteUpload(image.path)));

  revalidateStore(product.slug);
  return { ok: true };
}

// ── Categorías (el admin las diseña a medida que carga productos) ──

export async function createCategory(
  name: string
): Promise<
  { ok: true; category: { id: string; name: string } } | { ok: false; error: string }
> {
  await requireAdmin();

  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { ok: false, error: "El nombre de la categoría es muy corto." };
  }

  const existing = await prisma.category.findFirst({
    where: { name: { equals: trimmed, mode: "insensitive" } },
  });
  if (existing) {
    return { ok: true, category: { id: existing.id, name: existing.name } };
  }

  const slugBase = slugify(trimmed) || "categoria";
  let slug = slugBase;
  let suffix = 2;
  while (await prisma.category.findUnique({ where: { slug } })) {
    slug = `${slugBase}-${suffix}`;
    suffix += 1;
  }

  const position = await prisma.category.count();
  const category = await prisma.category.create({
    data: { name: trimmed, slug, position },
  });

  revalidateStore();
  revalidatePath("/admin/configuracion");
  return { ok: true, category: { id: category.id, name: category.name } };
}

export async function renameCategory(
  categoryId: string,
  name: string
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const trimmed = name.trim();
  if (trimmed.length < 2) return { ok: false, error: "Nombre muy corto." };

  await prisma.category.update({
    where: { id: categoryId },
    data: { name: trimmed },
  });
  revalidateStore();
  revalidatePath("/admin/configuracion");
  return { ok: true };
}

export async function deleteCategory(
  categoryId: string
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  // Los productos no se borran: solo pierden la etiqueta de la categoría.
  await prisma.category.delete({ where: { id: categoryId } }).catch(() => null);
  revalidateStore();
  revalidatePath("/admin/configuracion");
  return { ok: true };
}

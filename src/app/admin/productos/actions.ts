"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deleteUpload } from "@/lib/uploads";
import {
  combinations,
  optionsKey,
  slugify,
  variantName,
} from "@/lib/product-options";

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
  options: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Cada opción necesita un nombre.").max(30),
        values: z
          .array(z.string().trim().min(1).max(40))
          .min(1, "Cada opción necesita al menos un valor."),
      })
    )
    .max(3, "Máximo 3 opciones por producto."),
  variants: z.array(
    z.object({
      selection: z.record(z.string(), z.string()),
      stock: z.number().int().min(0).max(1_000_000),
      priceCents: z.number().int().min(0).nullable(),
      sku: z.string().trim().max(60).optional().or(z.literal("")),
    })
  ),
});

export type ProductInput = z.infer<typeof productSchema>;

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

  // Las variantes definitivas salen SIEMPRE de las combinaciones de opciones:
  // lo que mande el cliente solo aporta stock/precio/sku por combinación.
  const finalVariants = combinations(data.options).map((combo) => {
    const key = optionsKey(combo);
    const provided = data.variants.find(
      (variant) => optionsKey(variant.selection) === key
    );
    return {
      optionsKey: key,
      name: variantName(combo),
      stock: provided?.stock ?? 0,
      priceCents: provided?.priceCents ?? null,
      sku: provided?.sku || null,
    };
  });

  const optionsJson =
    data.options.length > 0
      ? (data.options as unknown as Prisma.InputJsonValue)
      : Prisma.JsonNull;

  const baseData = {
    name: data.name,
    description: data.description || null,
    priceCents: data.priceCents,
    compareAtCents: data.compareAtCents,
    active: data.active,
    featured: data.featured,
    options: optionsJson,
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

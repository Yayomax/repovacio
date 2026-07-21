"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  createCategory,
  deleteProduct,
  saveProduct,
} from "@/app/admin/productos/actions";
import { Spinner } from "@/components/Spinner";
import { prepareImageForUpload } from "@/lib/image-client";
import { toCents } from "@/lib/money";

type SizeDraft = { name: string; stock: string };

export type ProductFormInitial = {
  id: string;
  name: string;
  description: string;
  price: string;
  compareAt: string;
  active: boolean;
  featured: boolean;
  categoryIds: string[];
  images: { path: string; alt: string | null }[];
  stock: string; // stock cuando no hay talles
  sizes: SizeDraft[]; // talles con su stock (vacío = sin talles)
};

export function ProductForm({
  initial,
  categories: initialCategories,
}: {
  initial?: ProductFormInitial;
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial?.price ?? "");
  const [compareAt, setCompareAt] = useState(initial?.compareAt ?? "");
  const [active, setActive] = useState(initial?.active ?? true);
  const [featured, setFeatured] = useState(initial?.featured ?? false);

  const [categories, setCategories] = useState(initialCategories);
  const [categoryIds, setCategoryIds] = useState<string[]>(
    initial?.categoryIds ?? []
  );
  const [newCategory, setNewCategory] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  const [images, setImages] = useState<{ path: string; alt: string | null }[]>(
    initial?.images ?? []
  );
  const [uploading, setUploading] = useState(false);

  const [stock, setStock] = useState(initial?.stock ?? "0");
  const [sizes, setSizes] = useState<SizeDraft[]>(initial?.sizes ?? []);

  // ── Talles ──
  function addSize() {
    setSizes((current) => [...current, { name: "", stock: "0" }]);
  }

  function setSizeField(index: number, field: keyof SizeDraft, value: string) {
    setSizes((current) =>
      current.map((size, i) => (i === index ? { ...size, [field]: value } : size))
    );
  }

  function removeSize(index: number) {
    setSizes((current) => current.filter((_, i) => i !== index));
  }

  // ── Categorías inline ──
  function toggleCategory(id: string) {
    setCategoryIds((current) =>
      current.includes(id)
        ? current.filter((categoryId) => categoryId !== id)
        : [...current, id]
    );
  }

  async function handleCreateCategory() {
    const trimmed = newCategory.trim();
    if (trimmed.length < 2) return;
    setCreatingCategory(true);
    const result = await createCategory(trimmed);
    setCreatingCategory(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setCategories((current) =>
      current.some((category) => category.id === result.category.id)
        ? current
        : [...current, result.category]
    );
    setCategoryIds((current) =>
      current.includes(result.category.id)
        ? current
        : [...current, result.category.id]
    );
    setNewCategory("");
    toast.success(`Categoría "${result.category.name}" lista.`);
  }

  // ── Imágenes ──
  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const original of Array.from(files)) {
      // Se comprime en el navegador antes de subir: así el archivo viaja
      // liviano y no lo corta el límite de tamaño del hosting.
      const file = await prepareImageForUpload(original);
      const formData = new FormData();
      formData.append("file", file);
      try {
        const response = await fetch("/api/admin/uploads", {
          method: "POST",
          body: formData,
        });
        const data = (await response
          .json()
          .catch(() => ({}))) as { path?: string; error?: string };
        if (!response.ok || !data.path) {
          toast.error(
            data.error ??
              `No se pudo subir ${original.name} (código ${response.status}).`
          );
          continue;
        }
        setImages((current) => [...current, { path: data.path!, alt: null }]);
      } catch {
        toast.error(`Error de red subiendo ${original.name}.`);
      }
    }
    setUploading(false);
  }

  function moveImage(index: number, direction: -1 | 1) {
    setImages((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  const toStock = (value: string) =>
    Math.max(0, Number.parseInt(value || "0", 10) || 0);

  // ── Guardar ──
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const priceCents = toCents(price);
    if (priceCents === null) {
      toast.error("Ingresa un precio válido.");
      return;
    }
    const compareAtCents = compareAt.trim() ? toCents(compareAt) : null;

    // Solo se envían los talles con nombre; el resto se ignora.
    const validSizes = sizes
      .filter((size) => size.name.trim())
      .map((size) => ({ name: size.name.trim(), stock: toStock(size.stock) }));

    // Talles repetidos (mismo nombre normalizado) → error claro antes de enviar.
    const seen = new Set<string>();
    for (const size of validSizes) {
      const key = size.name.toLowerCase();
      if (seen.has(key)) {
        toast.error(`El talle "${size.name}" está repetido.`);
        return;
      }
      seen.add(key);
    }

    startTransition(async () => {
      const result = await saveProduct({
        id: initial?.id,
        name,
        description,
        priceCents,
        compareAtCents,
        active,
        featured,
        categoryIds,
        images,
        stock: toStock(stock),
        sizes: validSizes,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(initial ? "Producto actualizado." : "Producto publicado.");
      router.push("/admin/productos");
      router.refresh();
    });
  }

  function handleDelete() {
    if (!initial) return;
    if (
      !window.confirm(
        "¿Eliminar este producto? Se quita del catálogo y de la tienda. Los pedidos ya realizados no se pierden."
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await deleteProduct(initial.id);
      if (!result.ok) {
        toast.error(result.error ?? "No se pudo eliminar.");
        return;
      }
      toast.success("Producto eliminado.");
      router.push("/admin/productos");
      router.refresh();
    });
  }

  const inputLabel = "text-xs font-medium uppercase tracking-widest text-neutral-400";

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr,320px]">
      <div className="space-y-5">
        {/* Básicos */}
        <section className="card space-y-4 p-6">
          <div className="space-y-1.5">
            <label htmlFor="product-name" className={inputLabel}>
              Nombre del producto
            </label>
            <input
              id="product-name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="field"
              placeholder="Ej: Remera oversize"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="product-description" className={inputLabel}>
              Descripción
            </label>
            <textarea
              id="product-description"
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="field resize-none"
              placeholder="Materiales, medidas, cuidados..."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="product-price" className={inputLabel}>
                Precio
              </label>
              <input
                id="product-price"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                required
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                className="field"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="product-compare" className={inputLabel}>
                Precio anterior{" "}
                <span className="normal-case text-neutral-600">(oferta, opcional)</span>
              </label>
              <input
                id="product-compare"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={compareAt}
                onChange={(event) => setCompareAt(event.target.value)}
                className="field"
                placeholder="Se muestra tachado"
              />
            </div>
          </div>
        </section>

        {/* Imágenes */}
        <section className="card p-6">
          <h2 className="font-semibold">Imágenes</h2>
          <p className="mt-1 text-xs text-neutral-500">
            La primera imagen es la portada. Sube cualquier foto (JPG, PNG,
            HEIC del iPhone, etc., hasta 25 MB): se optimiza y convierte a
            WebP automáticamente.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {images.map((image, index) => (
              <div
                key={image.path}
                className="group relative aspect-square overflow-hidden rounded-xl border border-white/10"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/uploads/${image.path}`}
                  alt=""
                  className="h-full w-full object-cover"
                />
                {index === 0 && (
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-black">
                    Portada
                  </span>
                )}
                {/* En touch no hay hover: los controles quedan siempre visibles */}
                <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1.5 bg-black/70 p-1.5 md:opacity-0 md:transition-opacity md:duration-150 md:group-hover:opacity-100">
                  <button
                    type="button"
                    aria-label="Mover a la izquierda"
                    onClick={() => moveImage(index, -1)}
                    className="press min-w-8 rounded-md bg-white/10 px-2 py-1 text-xs hover:bg-white/25"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    aria-label="Quitar imagen"
                    onClick={() =>
                      setImages((current) => current.filter((_, i) => i !== index))
                    }
                    className="press min-w-8 rounded-md bg-white/10 px-2 py-1 text-xs hover:bg-red-400/40"
                  >
                    ✕
                  </button>
                  <button
                    type="button"
                    aria-label="Mover a la derecha"
                    onClick={() => moveImage(index, 1)}
                    className="press min-w-8 rounded-md bg-white/10 px-2 py-1 text-xs hover:bg-white/25"
                  >
                    →
                  </button>
                </div>
              </div>
            ))}

            <label className="press flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/20 text-neutral-400 transition-colors duration-150 hover:border-white/50 hover:text-white">
              {uploading ? (
                <Spinner />
              ) : (
                <>
                  <span className="text-2xl">+</span>
                  <span className="text-xs">Subir</span>
                </>
              )}
              <input
                type="file"
                accept="image/*,.heic,.heif"
                multiple
                className="hidden"
                onChange={(event) => {
                  void handleUpload(event.target.files);
                  event.target.value = "";
                }}
              />
            </label>
          </div>
        </section>

        {/* Talles y stock */}
        <section className="card p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Talles y stock</h2>
              <p className="mt-1 text-xs text-neutral-500">
                {sizes.length === 0
                  ? "Este producto no maneja talles. Si vendés por talle, agregá uno."
                  : "Cargá cada talle con su stock."}
              </p>
            </div>
            <button
              type="button"
              onClick={addSize}
              className="btn-ghost shrink-0 px-4 py-2 text-xs"
            >
              + Agregar talle
            </button>
          </div>

          {sizes.length === 0 ? (
            <div className="mt-4 max-w-xs space-y-1.5">
              <label htmlFor="product-stock" className={inputLabel}>
                Stock
              </label>
              <input
                id="product-stock"
                type="number"
                inputMode="numeric"
                min="0"
                value={stock}
                onChange={(event) => setStock(event.target.value)}
                className="field"
              />
            </div>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {sizes.map((size, index) => (
                <li
                  key={index}
                  className="flex items-end gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-3"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <label className="block text-[10px] font-medium uppercase tracking-widest text-neutral-500">
                      Talle
                    </label>
                    <input
                      value={size.name}
                      onChange={(event) =>
                        setSizeField(index, "name", event.target.value)
                      }
                      placeholder="ej: S, M, L, 42..."
                      className="field py-2"
                    />
                  </div>
                  <div className="w-24 space-y-1">
                    <label className="block text-[10px] font-medium uppercase tracking-widest text-neutral-500">
                      Stock
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      value={size.stock}
                      onChange={(event) =>
                        setSizeField(index, "stock", event.target.value)
                      }
                      className="field py-2"
                    />
                  </div>
                  <button
                    type="button"
                    aria-label={`Quitar talle ${size.name || index + 1}`}
                    onClick={() => removeSize(index)}
                    className="press grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/15 text-neutral-400 transition-colors duration-150 hover:border-red-400/60 hover:text-red-300"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Columna lateral */}
      <aside className="space-y-5">
        <section className="card space-y-4 p-6">
          <h2 className="font-semibold">Publicación</h2>
          <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
            <span>
              <span className="block font-medium">Visible en la tienda</span>
              <span className="block text-xs text-neutral-500">
                Desactívalo para guardar como borrador.
              </span>
            </span>
            <input
              type="checkbox"
              checked={active}
              onChange={(event) => setActive(event.target.checked)}
              className="h-5 w-5 accent-white"
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
            <span>
              <span className="block font-medium">Destacado</span>
              <span className="block text-xs text-neutral-500">
                Aparece primero en la portada.
              </span>
            </span>
            <input
              type="checkbox"
              checked={featured}
              onChange={(event) => setFeatured(event.target.checked)}
              className="h-5 w-5 accent-white"
            />
          </label>
        </section>

        <section className="card p-6">
          <h2 className="font-semibold">Categorías</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Crea las que necesites, sin límites ni estructura fija.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {categories.map((category) => {
              const selected = categoryIds.includes(category.id);
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className={`press rounded-full border px-3.5 py-1.5 text-sm transition-colors duration-150 ${
                    selected
                      ? "border-white bg-white font-semibold text-black"
                      : "border-white/15 text-neutral-300 hover:border-white/50"
                  }`}
                >
                  {category.name}
                </button>
              );
            })}
            {categories.length === 0 && (
              <p className="text-sm text-neutral-500">
                Todavía no hay categorías: crea la primera acá abajo.
              </p>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={newCategory}
              onChange={(event) => setNewCategory(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleCreateCategory();
                }
              }}
              placeholder="Nueva categoría..."
              className="field py-2 text-sm"
            />
            <button
              type="button"
              disabled={creatingCategory || newCategory.trim().length < 2}
              onClick={() => void handleCreateCategory()}
              className="btn-ghost shrink-0 px-4 py-2 text-xs"
            >
              {creatingCategory ? <Spinner /> : "+ Crear"}
            </button>
          </div>
        </section>

        {/* En mobile el guardar queda fijo sobre la barra de navegación */}
        <div className="fixed inset-x-0 z-30 border-t border-white/10 bg-[#080808]/95 px-4 py-3 backdrop-blur-xl [bottom:calc(3.6rem+env(safe-area-inset-bottom))] md:static md:z-auto md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
          <button
            type="submit"
            disabled={pending || uploading}
            className="btn-solid w-full py-3"
          >
            {pending ? <Spinner /> : null}
            {pending
              ? "Guardando..."
              : uploading
                ? "Subiendo imágenes..."
                : initial
                  ? "Guardar cambios"
                  : "Publicar producto"}
          </button>
        </div>

        {initial && (
          <button
            type="button"
            disabled={pending}
            onClick={handleDelete}
            className="btn-danger-ghost w-full"
          >
            Eliminar producto
          </button>
        )}
      </aside>
    </form>
  );
}

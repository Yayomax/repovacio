"use client";

import { useMemo, useState, useTransition } from "react";
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
import {
  combinations,
  optionsKey,
  variantName,
  type ProductOptions,
} from "@/lib/product-options";

type VariantDraft = { stock: string; price: string; sku: string };

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
  options: ProductOptions;
  variants: Record<string, VariantDraft>; // por optionsKey
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

  const [options, setOptions] = useState<ProductOptions>(initial?.options ?? []);
  const [valueDrafts, setValueDrafts] = useState<Record<number, string>>({});
  const [variantDrafts, setVariantDrafts] = useState<Record<string, VariantDraft>>(
    initial?.variants ?? {}
  );

  const combos = useMemo(() => combinations(options), [options]);

  function variantDraft(key: string): VariantDraft {
    return variantDrafts[key] ?? { stock: "0", price: "", sku: "" };
  }

  function setVariantField(key: string, field: keyof VariantDraft, value: string) {
    setVariantDrafts((current) => ({
      ...current,
      [key]: { ...variantDraft(key), ...current[key], [field]: value },
    }));
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

  // ── Opciones ──
  function addOption() {
    if (options.length >= 3) return;
    setOptions((current) => [...current, { name: "", values: [] }]);
  }

  function setOptionName(index: number, value: string) {
    setOptions((current) =>
      current.map((option, i) => (i === index ? { ...option, name: value } : option))
    );
  }

  function addOptionValue(index: number) {
    const draft = (valueDrafts[index] ?? "").trim();
    if (!draft) return;
    setOptions((current) =>
      current.map((option, i) =>
        i === index && !option.values.includes(draft)
          ? { ...option, values: [...option.values, draft] }
          : option
      )
    );
    setValueDrafts((current) => ({ ...current, [index]: "" }));
  }

  function removeOptionValue(index: number, value: string) {
    setOptions((current) =>
      current.map((option, i) =>
        i === index
          ? { ...option, values: option.values.filter((v) => v !== value) }
          : option
      )
    );
  }

  function removeOption(index: number) {
    setOptions((current) => current.filter((_, i) => i !== index));
  }

  const validOptions = options.filter(
    (option) => option.name.trim() && option.values.length > 0
  );

  // ── Guardar ──
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const priceCents = toCents(price);
    if (priceCents === null) {
      toast.error("Ingresa un precio válido.");
      return;
    }
    const compareAtCents = compareAt.trim() ? toCents(compareAt) : null;

    const payloadVariants = combinations(validOptions).map((combo) => {
      const draft = variantDraft(optionsKey(combo));
      const overrideCents = draft.price.trim() ? toCents(draft.price) : null;
      return {
        selection: combo,
        stock: Math.max(0, Number.parseInt(draft.stock || "0", 10) || 0),
        priceCents: overrideCents,
        sku: draft.sku.trim(),
      };
    });

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
        options: validOptions,
        variants: payloadVariants,
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

        {/* Opciones y variantes */}
        <section className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Variantes</h2>
              <p className="mt-1 text-xs text-neutral-500">
                Define opciones como Talle o Color y el stock de cada combinación.
              </p>
            </div>
            {options.length < 3 && (
              <button type="button" onClick={addOption} className="btn-ghost px-4 py-2 text-xs">
                + Agregar opción
              </button>
            )}
          </div>

          {options.map((option, index) => (
            <div
              key={index}
              className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="flex items-center gap-3">
                <input
                  value={option.name}
                  onChange={(event) => setOptionName(index, event.target.value)}
                  placeholder="Nombre de la opción (ej: Talle)"
                  className="field py-2"
                />
                <button
                  type="button"
                  aria-label="Quitar opción"
                  onClick={() => removeOption(index)}
                  className="press shrink-0 text-neutral-500 hover:text-red-300"
                >
                  ✕
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {option.values.map((value) => (
                  <span
                    key={value}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1 text-sm"
                  >
                    {value}
                    <button
                      type="button"
                      aria-label={`Quitar ${value}`}
                      onClick={() => removeOptionValue(index, value)}
                      className="text-neutral-500 hover:text-red-300"
                    >
                      ✕
                    </button>
                  </span>
                ))}
                <div className="flex w-full items-center gap-2 sm:w-auto">
                  <input
                    value={valueDrafts[index] ?? ""}
                    onChange={(event) =>
                      setValueDrafts((current) => ({
                        ...current,
                        [index]: event.target.value,
                      }))
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addOptionValue(index);
                      }
                    }}
                    placeholder="Agregar valor (ej: M)"
                    className="field min-w-0 flex-1 py-1.5 sm:w-48 sm:flex-none"
                  />
                  <button
                    type="button"
                    aria-label="Agregar valor"
                    onClick={() => addOptionValue(index)}
                    disabled={!(valueDrafts[index] ?? "").trim()}
                    className="press grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/15 text-white transition-colors duration-150 hover:border-white/40 disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Matriz de stock: tarjetas en mobile, tabla en escritorio */}
          <div className="mt-5 space-y-3 sm:hidden">
            {combinations(validOptions).map((combo) => {
              const key = optionsKey(combo);
              const draft = variantDraft(key);
              const soldOut = (Number.parseInt(draft.stock || "0", 10) || 0) === 0;
              return (
                <div
                  key={key || "default"}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{variantName(combo)}</p>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        soldOut
                          ? "bg-red-400/20 text-red-300"
                          : "bg-white/10 text-neutral-200"
                      }`}
                    >
                      {soldOut ? "Sin stock" : `${draft.stock} u.`}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-medium uppercase tracking-widest text-neutral-500">
                        Stock
                      </label>
                      <input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        value={draft.stock}
                        onChange={(event) =>
                          setVariantField(key, "stock", event.target.value)
                        }
                        className="field px-3 py-2"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-medium uppercase tracking-widest text-neutral-500">
                        Precio
                      </label>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        value={draft.price}
                        onChange={(event) =>
                          setVariantField(key, "price", event.target.value)
                        }
                        placeholder="Base"
                        className="field px-3 py-2"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-medium uppercase tracking-widest text-neutral-500">
                        SKU
                      </label>
                      <input
                        value={draft.sku}
                        onChange={(event) =>
                          setVariantField(key, "sku", event.target.value)
                        }
                        placeholder="Opc."
                        className="field px-3 py-2"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-widest text-neutral-500">
                  <th className="py-2.5 pr-4 font-medium">
                    {validOptions.length > 0 ? "Combinación" : "Producto"}
                  </th>
                  <th className="w-28 py-2.5 pr-4 font-medium">Stock</th>
                  <th className="w-36 py-2.5 pr-4 font-medium">Precio propio</th>
                  <th className="w-32 py-2.5 font-medium">SKU</th>
                </tr>
              </thead>
              <tbody>
                {combinations(validOptions).map((combo) => {
                  const key = optionsKey(combo);
                  const draft = variantDraft(key);
                  return (
                    <tr key={key || "default"} className="border-b border-white/5 last:border-0">
                      <td className="py-2.5 pr-4 font-medium">
                        {variantName(combo)}
                      </td>
                      <td className="py-2.5 pr-4">
                        <input
                          type="number"
                          inputMode="numeric"
                          min="0"
                          value={draft.stock}
                          onChange={(event) =>
                            setVariantField(key, "stock", event.target.value)
                          }
                          className="field px-3 py-1.5"
                        />
                      </td>
                      <td className="py-2.5 pr-4">
                        <input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="0.01"
                          value={draft.price}
                          onChange={(event) =>
                            setVariantField(key, "price", event.target.value)
                          }
                          placeholder="Base"
                          className="field px-3 py-1.5"
                        />
                      </td>
                      <td className="py-2.5">
                        <input
                          value={draft.sku}
                          onChange={(event) =>
                            setVariantField(key, "sku", event.target.value)
                          }
                          placeholder="Opcional"
                          className="field px-3 py-1.5"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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

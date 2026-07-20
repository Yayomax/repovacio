/** Helpers puros de opciones/variantes, seguros para cliente y servidor. */

export type ProductOptions = { name: string; values: string[] }[];

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Clave normalizada de una combinación de opciones.
 * { Talle: "M", Color: "Negro" } → "color=negro|talle=m"
 */
export function optionsKey(selection: Record<string, string>): string {
  return Object.entries(selection)
    .map(([key, value]) => `${key.trim().toLowerCase()}=${value.trim().toLowerCase()}`)
    .sort()
    .join("|");
}

/** Producto cartesiano de los valores de cada opción → todas las combinaciones. */
export function combinations(options: ProductOptions): Record<string, string>[] {
  if (options.length === 0) return [{}];
  return options.reduce<Record<string, string>[]>(
    (acc, option) =>
      acc.flatMap((combo) =>
        option.values.map((value) => ({ ...combo, [option.name]: value }))
      ),
    [{}]
  );
}

/** Nombre visible de una combinación: "Negro / M". */
export function variantName(selection: Record<string, string>): string {
  const values = Object.values(selection);
  return values.length > 0 ? values.join(" / ") : "Único";
}

export function parseProductOptions(json: unknown): ProductOptions {
  if (!Array.isArray(json)) return [];
  return json
    .filter(
      (opt): opt is { name: string; values: string[] } =>
        typeof opt === "object" &&
        opt !== null &&
        typeof (opt as { name?: unknown }).name === "string" &&
        Array.isArray((opt as { values?: unknown }).values)
    )
    .map((opt) => ({
      name: opt.name,
      values: opt.values.filter((v): v is string => typeof v === "string"),
    }));
}

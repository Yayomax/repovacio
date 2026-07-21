/** Helpers puros de talles, seguros para cliente y servidor. */

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

/** Nombre visible del talle "Único" cuando el producto no maneja talles. */
export const DEFAULT_SIZE_NAME = "Único";

/** Clave normalizada de un talle (para el índice único por producto). */
export function sizeKey(name: string): string {
  const normalized = name.trim().toLowerCase();
  return normalized === "" ? "default" : normalized;
}

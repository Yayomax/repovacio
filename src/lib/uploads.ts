import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export const UPLOADS_DIR =
  process.env.UPLOADS_DIR?.trim() || path.join(process.cwd(), "uploads");

const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

export const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

/**
 * Guarda una imagen subida por el admin y devuelve su ruta relativa
 * (ej. "products/uuid.webp"), servida luego en /uploads/products/uuid.webp.
 */
export async function saveProductImage(
  file: File
): Promise<{ path: string } | { error: string }> {
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return { error: "Formato no soportado. Usa JPG, PNG, WebP, GIF o AVIF." };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { error: "La imagen no puede superar los 8 MB." };
  }

  const relative = path.posix.join("products", `${randomUUID()}${ext}`);
  const absolute = path.join(UPLOADS_DIR, relative);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, Buffer.from(await file.arrayBuffer()));
  return { path: relative };
}

/** Resuelve una ruta relativa dentro de UPLOADS_DIR, bloqueando path traversal. */
export function resolveUploadPath(relative: string): string | null {
  const absolute = path.resolve(UPLOADS_DIR, relative);
  if (!absolute.startsWith(path.resolve(UPLOADS_DIR) + path.sep)) return null;
  return absolute;
}

export async function deleteUpload(relative: string): Promise<void> {
  const absolute = resolveUploadPath(relative);
  if (!absolute) return;
  await fs.unlink(absolute).catch(() => {
    /* ya no existe: ignorar */
  });
}

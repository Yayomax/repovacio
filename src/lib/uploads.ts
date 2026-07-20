import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp, { type Sharp } from "sharp";
import convertHeic from "heic-convert";
import bmp from "bmp-js";

export const UPLOADS_DIR =
  process.env.UPLOADS_DIR?.trim() || path.join(process.cwd(), "uploads");

/** Entrada generosa (una foto de iPhone puede pesar 10+ MB); la salida WebP es liviana. */
const MAX_INPUT_BYTES = 25 * 1024 * 1024;
const MAX_DIMENSION = 1600;
const WEBP_QUALITY = 82;

export const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

type ImageFormat =
  | "jpeg"
  | "png"
  | "webp"
  | "gif"
  | "avif"
  | "heic"
  | "tiff"
  | "bmp";

/**
 * Detecta el formato por los bytes reales del archivo (magic numbers).
 * No confiamos ni en la extensión ni en el MIME del navegador: los iPhone
 * suben .heic/.HEIC, a veces con MIME vacío u octet-stream.
 */
function sniffFormat(buffer: Buffer): ImageFormat | null {
  if (buffer.length < 16) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpeg";
  if (
    buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return "png";
  }
  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "webp";
  }
  if (buffer.subarray(0, 4).toString("ascii") === "GIF8") return "gif";

  // Contenedor ISO-BMFF (ftyp): HEIC/HEIF de iPhone, AVIF, etc.
  if (buffer.subarray(4, 8).toString("ascii") === "ftyp") {
    const brand = buffer.subarray(8, 12).toString("ascii");
    if (brand.startsWith("avif") || brand.startsWith("avis")) return "avif";
    return "heic"; // heic, heix, hevc, mif1, msf1, heif...
  }

  const tiffLE =
    buffer[0] === 0x49 && buffer[1] === 0x49 && buffer[2] === 0x2a && buffer[3] === 0x00;
  const tiffBE =
    buffer[0] === 0x4d && buffer[1] === 0x4d && buffer[2] === 0x00 && buffer[3] === 0x2a;
  if (tiffLE || tiffBE) return "tiff";

  if (buffer[0] === 0x42 && buffer[1] === 0x4d) return "bmp";

  return null;
}

async function decodeHeic(buffer: Buffer): Promise<Buffer> {
  const jpeg = await convertHeic({
    buffer: new Uint8Array(buffer),
    format: "JPEG",
    quality: 0.92,
  });
  return Buffer.from(jpeg);
}

/** sharp no lee BMP: se decodifica con bmp-js (entrega ABGR) y se pasa como raw RGBA. */
function decodeBmp(buffer: Buffer): Sharp {
  const decoded = bmp.decode(buffer);
  const pixels = decoded.data;
  for (let i = 0; i < pixels.length; i += 4) {
    const blue = pixels[i + 1];
    const green = pixels[i + 2];
    const red = pixels[i + 3];
    pixels[i] = red;
    pixels[i + 1] = green;
    pixels[i + 2] = blue;
    pixels[i + 3] = 255; // BMP no tiene alfa: forzar opaco
  }
  return sharp(pixels, {
    raw: { width: decoded.width, height: decoded.height, channels: 4 },
  });
}

/**
 * Normaliza cualquier imagen a WebP: corrige la rotación EXIF (fotos de
 * celular), limita el tamaño a 1600px y comprime. GIF/WebP animados
 * conservan la animación.
 */
async function processToWebp(
  buffer: Buffer,
  format: ImageFormat
): Promise<Buffer> {
  const source = format === "heic" ? await decodeHeic(buffer) : buffer;
  const animated = format === "gif" || format === "webp";

  const pipeline =
    format === "bmp" ? decodeBmp(source) : sharp(source, { animated });

  return pipeline
    .rotate() // aplica la orientación EXIF y la descarta
    .resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toBuffer();
}

/**
 * Guarda una imagen del admin convertida a WebP y devuelve su ruta relativa
 * (ej. "products/uuid.webp"), servida luego en /uploads/products/uuid.webp.
 */
export async function saveProductImage(
  file: File
): Promise<{ path: string } | { error: string }> {
  if (file.size > MAX_INPUT_BYTES) {
    return { error: "La imagen no puede superar los 25 MB." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const format = sniffFormat(buffer);
  if (!format) {
    return {
      error:
        "El archivo no parece ser una imagen. Formatos soportados: JPG/JPEG, PNG, HEIC/HEIF (iPhone), WebP, AVIF, GIF, TIFF y BMP.",
    };
  }

  let webp: Buffer;
  try {
    webp = await processToWebp(buffer, format);
  } catch (primaryError) {
    // Algunos HEIF raros se detectan como otra cosa (o al revés):
    // último intento pasando por el decodificador HEIC.
    try {
      webp = await processToWebp(buffer, "heic");
    } catch {
      console.error("Error procesando imagen subida:", primaryError);
      return {
        error: "No se pudo procesar la imagen. Prueba exportarla como JPG y volver a subirla.",
      };
    }
  }

  const relative = path.posix.join("products", `${randomUUID()}.webp`);
  const absolute = path.join(UPLOADS_DIR, relative);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, webp);
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

/**
 * Compresión de imágenes en el navegador, antes de subirlas.
 *
 * Por qué: si subimos el archivo original (una foto de iPhone pesa varios
 * MB), la request muere en el límite de tamaño del proxy del hosting
 * (ej. Render) antes de llegar al servidor. Reduciéndola en el cliente
 * viaja liviana y la subida es mucho más rápida en redes móviles.
 *
 * El servidor igual re-procesa lo que reciba (convierte a WebP, corrige
 * rotación), así que esto es una optimización: si algo falla, se envía el
 * original y el flujo sigue funcionando.
 */

const MAX_DIMENSION = 1600;
const WEBP_QUALITY = 0.85;

/**
 * Devuelve una versión reducida (WebP) del archivo cuando el navegador
 * puede decodificarlo; si no puede (típico con HEIC en algunos equipos)
 * o no hay ganancia de tamaño, devuelve el archivo original intacto.
 */
export async function prepareImageForUpload(file: File): Promise<File> {
  // Los GIF/animados se envían tal cual: el canvas solo tomaría el primer
  // frame y perderíamos la animación (el servidor la conserva).
  if (file.type === "image/gif") return file;

  if (typeof document === "undefined" || typeof createImageBitmap !== "function") {
    return file;
  }

  let bitmap: ImageBitmap;
  try {
    // imageOrientation: aplica la rotación EXIF al decodificar, así la
    // imagen re-codificada ya queda derecha (las fotos de celular).
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    try {
      bitmap = await createImageBitmap(file);
    } catch {
      return file; // el navegador no sabe decodificar este formato (ej. HEIC)
    }
  }

  try {
    let { width, height } = bitmap;
    if (width === 0 || height === 0) return file;

    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      const scale = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", WEBP_QUALITY)
    );
    if (!blob) return file;

    // Si no achicamos nada (imagen ya chica), mejor mandar el original.
    if (blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^./\\]+$/, "") || "imagen";
    return new File([blob], `${baseName}.webp`, { type: "image/webp" });
  } catch {
    return file;
  } finally {
    bitmap.close?.();
  }
}

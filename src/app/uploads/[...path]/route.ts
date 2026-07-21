import { NextResponse } from "next/server";
import { getUploadedImage } from "@/lib/uploads";

/**
 * Sirve las imágenes subidas por el admin desde la base de datos.
 * Sin dependencia de disco: funciona igual en Docker local y en hostings
 * sin almacenamiento persistente (ej. el free tier de Render).
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await context.params;
  const relative = segments.join("/");

  const image = await getUploadedImage(relative);
  if (!image) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(image.data), {
    headers: {
      "Content-Type": image.contentType,
      // Los nombres son UUID: el contenido de una URL nunca cambia.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

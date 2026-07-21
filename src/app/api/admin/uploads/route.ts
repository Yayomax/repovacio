import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveProductImage } from "@/lib/uploads";

/** Subida de imágenes de producto (solo admin). Devuelve la ruta relativa. */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const formData = await request.formData().catch(() => null);
    const file = formData?.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
    }

    const result = await saveProductImage(file);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ path: result.path }, { status: 201 });
  } catch (error) {
    // Cualquier fallo inesperado (procesamiento, base de datos, memoria...)
    // se registra en el servidor y se devuelve como JSON legible para el
    // cliente, en vez de un 500 opaco que se ve como "error de red".
    console.error("Error inesperado en /api/admin/uploads:", error);
    const detail = error instanceof Error ? error.message : "desconocido";

    // Caso típico: la base no tiene todavía la tabla de imágenes porque el
    // esquema no se sincronizó tras actualizar. Damos el paso concreto.
    const missingTable =
      (typeof (error as { code?: string })?.code === "string" &&
        (error as { code: string }).code === "P2021") ||
      /does not exist|no existe|relation .* does not exist/i.test(detail);
    if (missingTable) {
      return NextResponse.json(
        {
          error:
            "Falta la tabla de imágenes en la base de datos. Ejecuta 'npm run db:push' (o redesplegá) para crearla y volvé a intentar.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: `No se pudo guardar la imagen (${detail}).` },
      { status: 500 }
    );
  }
}

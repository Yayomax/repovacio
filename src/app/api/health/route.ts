import { NextResponse } from "next/server";

/** Health check liviano (lo usa Render para saber que la app está viva). */
export function GET() {
  return NextResponse.json({ ok: true });
}

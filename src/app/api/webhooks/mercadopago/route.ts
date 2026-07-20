import { NextResponse } from "next/server";
import { verifyMpPayment } from "@/lib/order-service";

/**
 * Webhook de Mercado Pago. Recibe notificaciones de pago y verifica el
 * estado real contra la API (nunca confía en el cuerpo de la notificación).
 * Configurable automáticamente cuando AUTH_URL es https.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const body = (await request.json().catch(() => null)) as {
    type?: string;
    topic?: string;
    data?: { id?: string | number };
  } | null;

  const type = body?.type ?? body?.topic ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
  const paymentId =
    body?.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id");

  if (type === "payment" && paymentId) {
    await verifyMpPayment(String(paymentId));
  }

  // Siempre 200 para que MP no reintente indefinidamente.
  return NextResponse.json({ received: true });
}

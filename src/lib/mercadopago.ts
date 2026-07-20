import type { Order, OrderItem, StoreConfig } from "@prisma/client";

const MP_API = "https://api.mercadopago.com";

type MpPreference = {
  id: string;
  init_point: string;
  sandbox_init_point?: string;
};

export type MpPayment = {
  id: number;
  status: string; // approved | pending | rejected | ...
  external_reference?: string;
  transaction_amount?: number;
};

function baseUrl(): string {
  return (process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/**
 * Crea una preferencia de Checkout Pro y devuelve la URL de pago.
 * Usa la API REST directamente (sin SDK) con el Access Token del admin.
 */
export async function createPreference(
  config: StoreConfig,
  order: Order & { items: OrderItem[] }
): Promise<{ preferenceId: string; initPoint: string } | { error: string }> {
  if (!config.mpAccessToken) {
    return { error: "Mercado Pago no está configurado." };
  }

  const url = baseUrl();
  const isHttps = url.startsWith("https://");

  const items = order.items.map((item) => ({
    id: item.variantId ?? item.id,
    title:
      item.variantName && item.variantName !== "Único"
        ? `${item.productName} (${item.variantName})`
        : item.productName,
    quantity: item.quantity,
    unit_price: item.unitCents / 100,
    currency_id: config.currency,
  }));

  if (order.shippingCents > 0) {
    items.push({
      id: "shipping",
      title: `Envío: ${order.shippingName ?? "Envío"}`,
      quantity: 1,
      unit_price: order.shippingCents / 100,
      currency_id: config.currency,
    });
  }

  const body: Record<string, unknown> = {
    items,
    payer: { email: order.email, name: order.name },
    external_reference: order.id,
    back_urls: {
      success: `${url}/pedido/${order.code}`,
      pending: `${url}/pedido/${order.code}`,
      failure: `${url}/pedido/${order.code}?mp_error=1`,
    },
    statement_descriptor: config.storeName.slice(0, 22),
  };

  // auto_return y webhooks requieren URLs públicas https
  if (isHttps) {
    body.auto_return = "approved";
    body.notification_url = `${url}/api/webhooks/mercadopago`;
  }

  try {
    const response = await fetch(`${MP_API}/checkout/preferences`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.mpAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("Mercado Pago rechazó la preferencia:", response.status, detail);
      return {
        error:
          "Mercado Pago rechazó la solicitud. Revisa que el Access Token cargado en Configuración → Pagos sea válido.",
      };
    }

    const preference = (await response.json()) as MpPreference;
    return { preferenceId: preference.id, initPoint: preference.init_point };
  } catch (error) {
    console.error("Error conectando con Mercado Pago:", error);
    return { error: "No se pudo conectar con Mercado Pago. Intenta de nuevo." };
  }
}

/** Consulta un pago por id con el Access Token del admin. */
export async function getPayment(
  config: StoreConfig,
  paymentId: string
): Promise<MpPayment | null> {
  if (!config.mpAccessToken) return null;
  try {
    const response = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${config.mpAccessToken}` },
    });
    if (!response.ok) return null;
    return (await response.json()) as MpPayment;
  } catch {
    return null;
  }
}

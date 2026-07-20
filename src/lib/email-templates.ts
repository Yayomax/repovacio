import type { Order, OrderItem, StoreConfig } from "@prisma/client";
import { formatMoney } from "@/lib/money";

type OrderWithItems = Order & { items: OrderItem[] };

function layout(config: StoreConfig, title: string, body: string): string {
  return `<!doctype html>
<html lang="es">
<body style="margin:0;padding:0;background:#f4f4f4;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="text-align:center;padding-bottom:20px;">
      <span style="display:inline-block;background:#0a0a0a;color:#ffffff;font-weight:700;letter-spacing:4px;text-transform:uppercase;font-size:13px;padding:10px 18px;border-radius:10px;">${config.storeName}</span>
    </div>
    <div style="background:#ffffff;border-radius:16px;padding:32px;border:1px solid #e5e5e5;">
      <h1 style="margin:0 0 12px;font-size:20px;color:#0a0a0a;">${title}</h1>
      ${body}
    </div>
    <p style="text-align:center;color:#8a8a8a;font-size:12px;margin-top:20px;">
      Este email fue enviado por ${config.storeName}.
    </p>
  </div>
</body>
</html>`;
}

function itemsTable(order: OrderWithItems, currency: string): string {
  const rows = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 0;color:#0a0a0a;font-size:14px;">
          ${item.productName}${item.variantName && item.variantName !== "Único" ? ` <span style="color:#8a8a8a;">(${item.variantName})</span>` : ""}
          <span style="color:#8a8a8a;">× ${item.quantity}</span>
        </td>
        <td style="padding:8px 0;text-align:right;color:#0a0a0a;font-size:14px;">
          ${formatMoney(item.unitCents * item.quantity, currency)}
        </td>
      </tr>`
    )
    .join("");

  const shippingRow = order.shippingName
    ? `<tr>
        <td style="padding:8px 0;color:#525252;font-size:14px;">Envío: ${order.shippingName}</td>
        <td style="padding:8px 0;text-align:right;color:#0a0a0a;font-size:14px;">${formatMoney(order.shippingCents, currency)}</td>
      </tr>`
    : "";

  return `
    <table style="width:100%;border-collapse:collapse;margin:16px 0;border-top:1px solid #e5e5e5;">
      ${rows}
      ${shippingRow}
      <tr>
        <td style="padding:12px 0;border-top:1px solid #e5e5e5;font-weight:700;color:#0a0a0a;">Total</td>
        <td style="padding:12px 0;border-top:1px solid #e5e5e5;text-align:right;font-weight:700;color:#0a0a0a;">${formatMoney(order.totalCents, currency)}</td>
      </tr>
    </table>`;
}

/** Confirmación de pedido. Para transferencias incluye las instrucciones de pago. */
export function orderReceivedEmail(
  config: StoreConfig,
  order: OrderWithItems
): { subject: string; html: string } {
  const currency = config.currency;
  const transferBlock =
    order.paymentMethod === "TRANSFER"
      ? `
      <div style="background:#f7f7f7;border:1px solid #e5e5e5;border-radius:12px;padding:20px;margin-top:16px;">
        <p style="margin:0 0 10px;font-weight:700;color:#0a0a0a;font-size:14px;">💳 Cómo pagar por transferencia</p>
        ${config.transferAlias ? `<p style="margin:4px 0;color:#525252;font-size:14px;">Alias: <strong style="color:#0a0a0a;">${config.transferAlias}</strong></p>` : ""}
        ${config.transferCbu ? `<p style="margin:4px 0;color:#525252;font-size:14px;">CBU/CVU: <strong style="color:#0a0a0a;">${config.transferCbu}</strong></p>` : ""}
        ${config.transferHolder ? `<p style="margin:4px 0;color:#525252;font-size:14px;">Titular: <strong style="color:#0a0a0a;">${config.transferHolder}</strong></p>` : ""}
        <p style="margin:4px 0;color:#525252;font-size:14px;">Monto: <strong style="color:#0a0a0a;">${formatMoney(order.totalCents, currency)}</strong></p>
        <p style="margin:12px 0 0;color:#525252;font-size:14px;line-height:1.5;">
          Luego envía el comprobante junto con tu código de pedido
          <strong style="color:#0a0a0a;">${order.code}</strong> a
          <a href="mailto:${config.transferEmail}?subject=Comprobante pedido ${order.code}" style="color:#0a0a0a;font-weight:700;">${config.transferEmail}</a>.
          Cuando lo verifiquemos te confirmaremos el pago por este medio.
        </p>
        ${config.transferNotes ? `<p style="margin:10px 0 0;color:#8a8a8a;font-size:13px;">${config.transferNotes}</p>` : ""}
      </div>`
      : `<p style="color:#525252;font-size:14px;line-height:1.5;">Estamos esperando la acreditación de tu pago en Mercado Pago. Te avisaremos apenas se confirme.</p>`;

  return {
    subject: `Pedido ${order.code} recibido — ${config.storeName}`,
    html: layout(
      config,
      `¡Gracias por tu compra, ${order.name}!`,
      `
      <p style="color:#525252;font-size:14px;line-height:1.5;">
        Recibimos tu pedido <strong style="color:#0a0a0a;">${order.code}</strong>.
      </p>
      ${itemsTable(order, currency)}
      ${transferBlock}
      `
    ),
  };
}

export function paymentConfirmedEmail(
  config: StoreConfig,
  order: OrderWithItems
): { subject: string; html: string } {
  return {
    subject: `Pago confirmado — pedido ${order.code}`,
    html: layout(
      config,
      "✓ Tu pago fue confirmado",
      `
      <p style="color:#525252;font-size:14px;line-height:1.5;">
        Hola ${order.name}: confirmamos el pago de tu pedido
        <strong style="color:#0a0a0a;">${order.code}</strong>.
        Ya estamos preparándolo${order.shippingName ? ` (${order.shippingName})` : ""}.
      </p>
      ${itemsTable(order, config.currency)}
      `
    ),
  };
}

export function adminNewOrderEmail(
  config: StoreConfig,
  order: OrderWithItems
): { subject: string; html: string } {
  const method =
    order.paymentMethod === "TRANSFER" ? "Transferencia (validar comprobante)" : "Mercado Pago";
  return {
    subject: `Nuevo pedido ${order.code} — ${formatMoney(order.totalCents, config.currency)}`,
    html: layout(
      config,
      "🛎 Nuevo pedido recibido",
      `
      <p style="color:#525252;font-size:14px;line-height:1.5;">
        <strong style="color:#0a0a0a;">${order.name}</strong> (${order.email}${order.phone ? `, ${order.phone}` : ""})
        realizó el pedido <strong style="color:#0a0a0a;">${order.code}</strong>.<br/>
        Método de pago: <strong style="color:#0a0a0a;">${method}</strong>.
        ${order.address ? `<br/>Dirección: ${order.address}` : ""}
      </p>
      ${itemsTable(order, config.currency)}
      <p style="color:#525252;font-size:14px;">Gestionalo desde el panel de administración → Pedidos.</p>
      `
    ),
  };
}

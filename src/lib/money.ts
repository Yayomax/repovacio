/** Los precios se guardan siempre como enteros en centavos. */

export function formatMoney(cents: number, currency = "ARS"): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

/** Convierte el valor de un <input type="number" step="0.01"> a centavos. */
export function toCents(value: string | number): number | null {
  const num = typeof value === "number" ? value : Number.parseFloat(value);
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.round(num * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

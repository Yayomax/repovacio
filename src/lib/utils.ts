import { randomBytes } from "node:crypto";

export {
  combinations,
  optionsKey,
  parseProductOptions,
  slugify,
  variantName,
  type ProductOptions,
} from "@/lib/product-options";

/** Código corto legible para pedidos, ej. "WL-4F7K2Q". Solo servidor. */
export function generateOrderCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(6);
  let code = "";
  for (const byte of bytes) code += alphabet[byte % alphabet.length];
  return `WL-${code}`;
}

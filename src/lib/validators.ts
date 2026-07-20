import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const checkoutSchema = z.object({
  name: z.string().trim().min(2, "Ingresa tu nombre.").max(80),
  email: z.string().trim().toLowerCase().email("El email no es válido."),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  shippingOptionId: z.string().optional().or(z.literal("")),
  paymentMethod: z.enum(["MERCADOPAGO", "TRANSFER"]),
  items: z
    .array(
      z.object({
        variantId: z.string().min(1),
        quantity: z.number().int().min(1).max(999),
      })
    )
    .min(1, "El carrito está vacío."),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(60, "El nombre no puede superar los 60 caracteres."),
  email: z.string().trim().toLowerCase().email("El email no es válido."),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres.")
    .max(72, "La contraseña no puede superar los 72 caracteres."),
});

import { cache } from "react";
import type { StoreConfig } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Configuración de la tienda (fila única). Cacheada por request.
 * Se crea con valores por defecto la primera vez que se consulta.
 */
export const getStoreConfig = cache(async (): Promise<StoreConfig> => {
  const existing = await prisma.storeConfig.findUnique({ where: { id: 1 } });
  if (existing) return existing;

  return prisma.storeConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      storeName: process.env.APP_NAME?.trim() || "White Label",
    },
  });
});

export function mpConfigured(config: StoreConfig): boolean {
  return Boolean(config.mpAccessToken && config.mpPublicKey);
}

export function transferConfigured(config: StoreConfig): boolean {
  return Boolean(config.transferEmail && (config.transferAlias || config.transferCbu));
}

export function smtpConfigured(config: StoreConfig): boolean {
  return Boolean(config.smtpHost && config.emailFrom);
}

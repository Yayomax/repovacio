"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toCents } from "@/lib/money";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("No autorizado.");
}

function clean(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function revalidateAll() {
  revalidatePath("/", "layout");
  revalidatePath("/admin/configuracion");
}

type Result = { ok: boolean; error?: string };

export async function updateGeneral(input: {
  storeName: string;
  tagline: string;
  currency: string;
}): Promise<Result> {
  await requireAdmin();

  const storeName = clean(input.storeName);
  if (!storeName) return { ok: false, error: "El nombre de la tienda es obligatorio." };

  const currency = (clean(input.currency) ?? "ARS").toUpperCase().slice(0, 3);

  await prisma.storeConfig.upsert({
    where: { id: 1 },
    update: { storeName, tagline: clean(input.tagline), currency },
    create: { id: 1, storeName, tagline: clean(input.tagline), currency },
  });
  revalidateAll();
  return { ok: true };
}

export async function updatePagos(input: {
  mpPublicKey: string;
  mpAccessToken: string;
  transferAlias: string;
  transferCbu: string;
  transferHolder: string;
  transferEmail: string;
  transferNotes: string;
}): Promise<Result> {
  await requireAdmin();

  const transferEmail = clean(input.transferEmail);
  if (transferEmail && !transferEmail.includes("@")) {
    return { ok: false, error: "El email para comprobantes no es válido." };
  }

  await prisma.storeConfig.upsert({
    where: { id: 1 },
    update: {
      mpPublicKey: clean(input.mpPublicKey),
      mpAccessToken: clean(input.mpAccessToken),
      transferAlias: clean(input.transferAlias),
      transferCbu: clean(input.transferCbu),
      transferHolder: clean(input.transferHolder),
      transferEmail,
      transferNotes: clean(input.transferNotes),
    },
    create: {
      id: 1,
      mpPublicKey: clean(input.mpPublicKey),
      mpAccessToken: clean(input.mpAccessToken),
      transferAlias: clean(input.transferAlias),
      transferCbu: clean(input.transferCbu),
      transferHolder: clean(input.transferHolder),
      transferEmail,
      transferNotes: clean(input.transferNotes),
    },
  });
  revalidateAll();
  return { ok: true };
}

export async function updateEmails(input: {
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPass: string;
  emailFrom: string;
  adminNotifyEmail: string;
}): Promise<Result> {
  await requireAdmin();

  const port = input.smtpPort.trim() ? Number.parseInt(input.smtpPort, 10) : null;
  if (input.smtpPort.trim() && (!Number.isInteger(port) || port! <= 0 || port! > 65535)) {
    return { ok: false, error: "El puerto SMTP no es válido." };
  }

  await prisma.storeConfig.upsert({
    where: { id: 1 },
    update: {
      smtpHost: clean(input.smtpHost),
      smtpPort: port,
      smtpUser: clean(input.smtpUser),
      smtpPass: clean(input.smtpPass),
      emailFrom: clean(input.emailFrom),
      adminNotifyEmail: clean(input.adminNotifyEmail),
    },
    create: {
      id: 1,
      smtpHost: clean(input.smtpHost),
      smtpPort: port,
      smtpUser: clean(input.smtpUser),
      smtpPass: clean(input.smtpPass),
      emailFrom: clean(input.emailFrom),
      adminNotifyEmail: clean(input.adminNotifyEmail),
    },
  });
  revalidateAll();
  return { ok: true };
}

// ── Opciones de envío ──

export async function createShippingOption(input: {
  name: string;
  description: string;
  price: string;
}): Promise<Result> {
  await requireAdmin();

  const name = clean(input.name);
  if (!name) return { ok: false, error: "La opción de envío necesita un nombre." };

  const priceCents = input.price.trim() ? toCents(input.price) : 0;
  if (priceCents === null) return { ok: false, error: "El precio no es válido." };

  const position = await prisma.shippingOption.count();
  await prisma.shippingOption.create({
    data: {
      name,
      description: clean(input.description),
      priceCents,
      position,
    },
  });
  revalidateAll();
  revalidatePath("/checkout");
  return { ok: true };
}

export async function toggleShippingOption(id: string): Promise<Result> {
  await requireAdmin();
  const option = await prisma.shippingOption.findUnique({ where: { id } });
  if (!option) return { ok: false, error: "La opción no existe." };

  await prisma.shippingOption.update({
    where: { id },
    data: { active: !option.active },
  });
  revalidateAll();
  revalidatePath("/checkout");
  return { ok: true };
}

export async function deleteShippingOption(id: string): Promise<Result> {
  await requireAdmin();
  await prisma.shippingOption.delete({ where: { id } }).catch(() => null);
  revalidateAll();
  revalidatePath("/checkout");
  return { ok: true };
}

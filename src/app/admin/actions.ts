"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("No autorizado.");
  }
  return session;
}

export async function deleteUser(formData: FormData) {
  const session = await requireAdmin();
  const userId = formData.get("userId");
  if (typeof userId !== "string" || !userId) return;

  // Un admin no puede eliminarse a sí mismo.
  if (userId === session.user.id) return;

  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin");
}

export async function toggleUserRole(formData: FormData) {
  const session = await requireAdmin();
  const userId = formData.get("userId");
  if (typeof userId !== "string" || !userId) return;

  // Un admin no puede cambiar su propio rol.
  if (userId === session.user.id) return;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  await prisma.user.update({
    where: { id: userId },
    data: { role: user.role === "ADMIN" ? "USER" : "ADMIN" },
  });
  revalidatePath("/admin");
}

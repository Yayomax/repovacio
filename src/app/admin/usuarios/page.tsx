import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UsersTable } from "@/components/admin/UsersTable";

export const metadata: Metadata = { title: "Gestión de usuarios" };

export default async function AdminUsersPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/welcome");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { accounts: { select: { provider: true } } },
  });

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const stats = [
    { label: "Usuarios totales", value: users.length },
    {
      label: "Administradores",
      value: users.filter((user) => user.role === "ADMIN").length,
    },
    {
      label: "Nuevos (7 días)",
      value: users.filter((user) => user.createdAt >= sevenDaysAgo).length,
    },
  ];

  const rows = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
    provider: user.accounts[0]?.provider === "google" ? "Google" : "Email",
    createdAt: user.createdAt.toISOString(),
    isSelf: user.id === session.user.id,
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Gestión de usuarios
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          Administra las cuentas, cambia roles y elimina usuarios.
        </p>
      </div>

      <div className="mt-6 grid animate-fade-up grid-cols-1 gap-3 [animation-delay:.1s] sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-5">
            <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">
              {stat.label}
            </p>
            <p className="mt-2 text-3xl font-semibold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="card mt-5 animate-fade-up overflow-hidden [animation-delay:.2s]">
        <UsersTable users={rows} />
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Logo } from "@/components/Logo";
import { SignOutButton } from "@/components/SignOutButton";
import { UsersTable } from "@/components/admin/UsersTable";

export const metadata: Metadata = { title: "Gestión de usuarios" };

export default async function AdminPage() {
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
    <main className="relative min-h-dvh">
      <AnimatedBackground />

      <header className="flex animate-fade-in items-center justify-between px-6 py-5 md:px-10">
        <Logo />
        <div className="flex items-center gap-3">
          <Link href="/welcome" className="btn-ghost">
            ← Volver
          </Link>
          <SignOutButton />
        </div>
      </header>

      <section className="mx-auto w-full max-w-5xl px-6 pb-16 pt-6">
        <div className="animate-fade-up">
          <span className="badge">Panel de administración</span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
            Gestión de usuarios
          </h1>
          <p className="mt-2 text-neutral-400">
            Administra las cuentas, cambia roles y elimina usuarios.
          </p>
        </div>

        <div className="mt-8 grid animate-fade-up grid-cols-1 gap-4 [animation-delay:.15s] sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="card p-5">
              <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">
                {stat.label}
              </p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="card mt-6 animate-fade-up overflow-hidden [animation-delay:.3s]">
          <UsersTable users={rows} />
        </div>
      </section>
    </main>
  );
}

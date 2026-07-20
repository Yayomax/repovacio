import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Logo } from "@/components/Logo";
import { SignOutButton } from "@/components/SignOutButton";

export const metadata: Metadata = { title: "Bienvenida" };

export default async function WelcomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user) redirect("/login");

  const displayName = user.name ?? user.email.split("@")[0];
  const initial = displayName.charAt(0).toUpperCase();
  const isAdmin = user.role === "ADMIN";
  const memberSince = new Intl.DateTimeFormat("es", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(user.createdAt);

  return (
    <main className="relative flex min-h-dvh flex-col">
      <AnimatedBackground />

      <header className="flex animate-fade-in items-center justify-between px-6 py-5 md:px-10">
        <Logo />
        <SignOutButton />
      </header>

      <section className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          <div className="card animate-fade-up p-8 text-center md:p-10">
            <div className="mx-auto grid h-20 w-20 animate-pulse-ring place-items-center overflow-hidden rounded-full border border-white/20 bg-white/10">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt={displayName}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-3xl font-semibold text-white">
                  {initial}
                </span>
              )}
            </div>

            <h1 className="mt-6 animate-fade-up text-3xl font-semibold tracking-tight [animation-delay:.1s] md:text-4xl">
              ¡Bienvenido, <span className="text-shimmer">{displayName}</span>!
            </h1>
            <p className="mt-2 animate-fade-up text-neutral-400 [animation-delay:.2s]">
              Iniciaste sesión correctamente. Este es tu espacio.
            </p>

            <dl className="mt-8 animate-fade-up space-y-3 text-left [animation-delay:.3s]">
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <dt className="text-xs font-medium uppercase tracking-widest text-neutral-500">
                  Email
                </dt>
                <dd className="text-sm text-white">{user.email}</dd>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <dt className="text-xs font-medium uppercase tracking-widest text-neutral-500">
                  Rol
                </dt>
                <dd>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      isAdmin
                        ? "bg-white text-black"
                        : "border border-white/20 text-neutral-200"
                    }`}
                  >
                    {isAdmin ? "Administrador" : "Usuario"}
                  </span>
                </dd>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <dt className="text-xs font-medium uppercase tracking-widest text-neutral-500">
                  Miembro desde
                </dt>
                <dd className="text-sm text-white">{memberSince}</dd>
              </div>
            </dl>

            <div className="mt-8 flex animate-fade-up flex-wrap items-center justify-center gap-3 [animation-delay:.4s]">
              <Link href="/" className="btn-ghost">
                ← Ir a la tienda
              </Link>
              <Link href="/mis-pedidos" className="btn-ghost">
                Mis pedidos
              </Link>
              <SignOutButton />
            </div>
          </div>

          {isAdmin && (
            <Link
              href="/admin"
              className="card group mt-4 flex animate-fade-up items-center justify-between p-5 transition-all duration-300 [animation-delay:.5s] hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/[0.06]"
            >
              <div>
                <p className="text-sm font-semibold text-white">
                  Panel de administración
                </p>
                <p className="mt-0.5 text-sm text-neutral-400">
                  Gestiona los usuarios de la plataforma.
                </p>
              </div>
              <span className="text-xl text-neutral-400 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-white">
                →
              </span>
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

import { googleEnabled } from "@/auth.config";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { LoginForm } from "@/components/LoginForm";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center px-6 py-12">
      <AnimatedBackground />

      <Link
        href="/"
        className="link-underline absolute left-6 top-6 animate-fade-in text-sm text-neutral-400 md:left-10"
      >
        ← Volver al inicio
      </Link>

      <div className="w-full max-w-md animate-fade-up">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="card p-8">
          <h1 className="text-2xl font-semibold tracking-tight">
            Bienvenido de nuevo
          </h1>
          <p className="mt-1.5 text-sm text-neutral-400">
            Ingresa a tu cuenta para continuar.
          </p>

          <div className="mt-7">
            <LoginForm googleEnabled={googleEnabled} />
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-neutral-400">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="link-underline font-medium">
            Crea una gratis
          </Link>
        </p>
      </div>
    </main>
  );
}

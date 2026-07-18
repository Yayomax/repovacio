import type { Metadata } from "next";
import Link from "next/link";

import { googleEnabled } from "@/auth.config";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Logo } from "@/components/Logo";
import { RegisterForm } from "@/components/RegisterForm";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function RegisterPage() {
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
            Crea tu cuenta
          </h1>
          <p className="mt-1.5 text-sm text-neutral-400">
            Cualquier persona puede registrarse. Es gratis.
          </p>

          <div className="mt-7">
            <RegisterForm googleEnabled={googleEnabled} />
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-neutral-400">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="link-underline font-medium">
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  );
}

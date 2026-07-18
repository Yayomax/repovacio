"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

import { GoogleButton } from "@/components/GoogleButton";
import { Spinner } from "@/components/Spinner";

export function RegisterForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
    };

    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "No se pudo crear la cuenta. Intenta de nuevo.");
      setLoading(false);
      return;
    }

    // Cuenta creada: iniciamos sesión automáticamente.
    const result = await signIn("credentials", {
      email: payload.email,
      password: payload.password,
      redirect: false,
    });

    if (result?.error) {
      router.push("/login");
      return;
    }

    router.push("/welcome");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-xs font-medium uppercase tracking-widest text-neutral-400">
            Nombre
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            placeholder="Tu nombre"
            className="field"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-xs font-medium uppercase tracking-widest text-neutral-400">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="tu@email.com"
            className="field"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-xs font-medium uppercase tracking-widest text-neutral-400">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="Mínimo 8 caracteres"
            className="field"
          />
        </div>

        {error && (
          <p
            role="alert"
            className="animate-shake rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-neutral-200"
          >
            ⚠ {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-solid w-full">
          {loading ? <Spinner /> : null}
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>

      {googleEnabled && (
        <>
          <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-neutral-500">
            <span className="h-px flex-1 bg-white/10" />
            o
            <span className="h-px flex-1 bg-white/10" />
          </div>
          <GoogleButton />
        </>
      )}
    </div>
  );
}

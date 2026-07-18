"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

import { GoogleButton } from "@/components/GoogleButton";
import { Spinner } from "@/components/Spinner";

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    if (result?.error) {
      setError("Email o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    router.push("/welcome");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
            autoComplete="current-password"
            required
            placeholder="••••••••••"
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
          {loading ? "Ingresando..." : "Iniciar sesión"}
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

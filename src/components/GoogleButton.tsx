"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Spinner } from "@/components/Spinner";

export function GoogleButton() {
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => {
        setLoading(true);
        void signIn("google", { callbackUrl: "/welcome" });
      }}
      className="btn-ghost w-full"
    >
      {loading ? (
        <Spinner />
      ) : (
        <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="#4285F4"
            d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.46a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.57-5.17 3.57-8.82Z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.28v3.09A12 12 0 0 0 12 24Z"
          />
          <path
            fill="#FBBC05"
            d="M5.27 14.28a7.2 7.2 0 0 1 0-4.56V6.63H1.28a12 12 0 0 0 0 10.74l3.99-3.09Z"
          />
          <path
            fill="#EA4335"
            d="M12 4.77c1.76 0 3.34.6 4.59 1.8l3.43-3.44A11.98 11.98 0 0 0 1.28 6.63l3.99 3.09C6.22 6.88 8.87 4.77 12 4.77Z"
          />
        </svg>
      )}
      Continuar con Google
    </button>
  );
}

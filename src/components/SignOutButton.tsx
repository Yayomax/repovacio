"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Spinner } from "@/components/Spinner";

export function SignOutButton() {
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => {
        setLoading(true);
        void signOut({ callbackUrl: "/" });
      }}
      className="btn-solid"
    >
      {loading ? <Spinner /> : null}
      {loading ? "Cerrando sesión..." : "Cerrar sesión"}
    </button>
  );
}

import Link from "next/link";

import { auth } from "@/auth";
import { getStoreConfig } from "@/lib/store-config";
import { Logo } from "@/components/Logo";
import { CartButton } from "@/components/store/CartButton";

export async function StoreHeader() {
  const [config, session] = await Promise.all([getStoreConfig(), auth()]);
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#060606]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Logo name={config.storeName} />

        <nav className="hidden items-center gap-6 text-sm text-neutral-300 md:flex">
          <Link href="/" className="link-underline">
            Inicio
          </Link>
          <Link href="/catalogo" className="link-underline">
            Catálogo
          </Link>
          {session?.user && (
            <Link href="/mis-pedidos" className="link-underline">
              Mis pedidos
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link href="/admin" className="btn-ghost hidden px-4 py-2 text-xs sm:inline-flex">
              Panel admin
            </Link>
          )}
          {session?.user ? (
            <Link
              href="/welcome"
              aria-label="Mi cuenta"
              className="press grid h-10 w-10 place-items-center rounded-full border border-white/15 text-sm font-semibold text-white hover:border-white/40"
            >
              {(session.user.name ?? session.user.email ?? "?")
                .charAt(0)
                .toUpperCase()}
            </Link>
          ) : (
            <Link href="/login" className="btn-ghost px-4 py-2 text-xs">
              Ingresar
            </Link>
          )}
          <CartButton />
        </div>
      </div>

      {/* Navegación mobile */}
      <nav className="flex items-center gap-5 overflow-x-auto px-6 pb-3 text-sm text-neutral-300 md:hidden">
        <Link href="/" className="shrink-0 transition-colors hover:text-white">
          Inicio
        </Link>
        <Link href="/catalogo" className="shrink-0 transition-colors hover:text-white">
          Catálogo
        </Link>
        {session?.user && (
          <Link
            href="/mis-pedidos"
            className="shrink-0 transition-colors hover:text-white"
          >
            Mis pedidos
          </Link>
        )}
      </nav>
    </header>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

import { SignOutButton } from "@/components/SignOutButton";

type IconName = "home" | "orders" | "products" | "users" | "settings";

function Icon({ name, className }: { name: IconName; className?: string }) {
  const paths: Record<IconName, React.ReactNode> = {
    home: (
      <>
        <path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
        <path d="M9 22V12h6v10" />
      </>
    ),
    orders: (
      <>
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" />
        <path d="M9 12h6" />
        <path d="M9 16h6" />
      </>
    ),
    products: (
      <>
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    settings: (
      <>
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {paths[name]}
    </svg>
  );
}

type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  badge?: number;
  exact?: boolean;
};

export function AdminShell({
  storeName,
  pendingOrders,
  children,
}: {
  storeName: string;
  pendingOrders: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const nav: NavItem[] = [
    { href: "/admin", label: "Inicio", icon: "home", exact: true },
    { href: "/admin/pedidos", label: "Pedidos", icon: "orders", badge: pendingOrders },
    { href: "/admin/productos", label: "Productos", icon: "products" },
    { href: "/admin/usuarios", label: "Usuarios", icon: "users" },
    { href: "/admin/configuracion", label: "Ajustes", icon: "settings" },
  ];

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div className="min-h-dvh bg-[#060606]">
      {/* ── Sidebar escritorio ── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-white/10 bg-[#080808] md:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white">
            <span className="h-2.5 w-2.5 rounded-sm bg-black" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold uppercase tracking-[0.15em] text-white">
              {storeName}
            </p>
            <p className="text-[11px] uppercase tracking-widest text-neutral-500">
              Admin
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {nav.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`press flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-colors duration-150 ${
                  active
                    ? "bg-white font-semibold text-black"
                    : "text-neutral-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon name={item.icon} className="h-[18px] w-[18px] shrink-0" />
                <span className="flex-1">
                  {item.label === "Ajustes" ? "Configuración" : item.label}
                </span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-bold ${
                      active ? "bg-black text-white" : "bg-white text-black"
                    }`}
                  >
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-white/10 p-4">
          <Link href="/" className="btn-ghost w-full text-xs">
            ← Ver tienda
          </Link>
          <SignOutButton />
        </div>
      </aside>

      {/* ── Barra superior mobile ── */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-white/10 bg-[#080808]/90 px-4 py-3 backdrop-blur-xl [padding-top:calc(0.75rem+env(safe-area-inset-top))] md:hidden">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white">
            <span className="h-2 w-2 rounded-sm bg-black" />
          </span>
          <p className="truncate text-sm font-semibold uppercase tracking-[0.12em]">
            {storeName}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/"
            className="press rounded-full border border-white/15 px-3.5 py-1.5 text-xs text-neutral-300 transition-colors duration-150 hover:border-white/40 hover:text-white"
          >
            Ver tienda
          </Link>
          <button
            type="button"
            aria-label="Cerrar sesión"
            onClick={() => void signOut({ callbackUrl: "/" })}
            className="press grid h-9 w-9 place-items-center rounded-full border border-white/15 text-neutral-300 transition-colors duration-150 hover:border-white/40 hover:text-white"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
              className="h-4 w-4"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="m16 17 5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
          </button>
        </div>
      </header>

      {/* Contenido (deja lugar para la barra inferior en mobile) */}
      <main className="px-4 py-6 pb-32 md:ml-60 md:px-8 md:py-8 md:pb-8">
        {children}
      </main>

      {/* ── Barra de navegación inferior mobile ── */}
      <nav
        aria-label="Navegación del panel"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#080808]/95 backdrop-blur-xl [padding-bottom:env(safe-area-inset-bottom)] md:hidden"
      >
        <div className="grid grid-cols-5">
          {nav.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`press relative flex flex-col items-center gap-1 py-2.5 transition-colors duration-150 ${
                  active ? "text-white" : "text-neutral-500"
                }`}
              >
                <span className="relative">
                  <Icon name={item.icon} className="h-[22px] w-[22px]" />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -right-2.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-white px-1 text-[10px] font-bold leading-none text-black">
                      {item.badge > 99 ? "99" : item.badge}
                    </span>
                  )}
                </span>
                <span
                  className={`text-[10px] leading-none ${
                    active ? "font-semibold" : "font-medium"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

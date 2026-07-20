"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SignOutButton } from "@/components/SignOutButton";

type NavItem = {
  href: string;
  label: string;
  icon: string;
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
    { href: "/admin", label: "Inicio", icon: "◧", exact: true },
    {
      href: "/admin/pedidos",
      label: "Pedidos",
      icon: "🧾",
      badge: pendingOrders,
    },
    { href: "/admin/productos", label: "Productos", icon: "📦" },
    { href: "/admin/usuarios", label: "Usuarios", icon: "👥" },
    { href: "/admin/configuracion", label: "Configuración", icon: "⚙" },
  ];

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const linkClass = (item: NavItem) =>
    `press flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-colors duration-150 ${
      isActive(item)
        ? "bg-white font-semibold text-black"
        : "text-neutral-300 hover:bg-white/5 hover:text-white"
    }`;

  return (
    <div className="min-h-dvh bg-[#060606]">
      {/* Sidebar escritorio */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-white/10 bg-[#080808] md:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-white">
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
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass(item)}>
              <span aria-hidden className="text-base">
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-bold ${
                    isActive(item) ? "bg-black text-white" : "bg-white text-black"
                  }`}
                >
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="space-y-2 border-t border-white/10 p-4">
          <Link href="/" className="btn-ghost w-full text-xs">
            ← Ver tienda
          </Link>
          <SignOutButton />
        </div>
      </aside>

      {/* Nav móvil */}
      <div className="sticky top-0 z-30 border-b border-white/10 bg-[#080808]/90 backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm font-semibold uppercase tracking-[0.15em]">
            {storeName} <span className="text-neutral-500">· Admin</span>
          </p>
          <Link href="/" className="text-xs text-neutral-400">
            Ver tienda →
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`press shrink-0 rounded-full px-4 py-1.5 text-sm transition-colors duration-150 ${
                isActive(item)
                  ? "bg-white font-semibold text-black"
                  : "border border-white/15 text-neutral-300"
              }`}
            >
              {item.label}
              {item.badge !== undefined && item.badge > 0 ? ` (${item.badge})` : ""}
            </Link>
          ))}
        </nav>
      </div>

      <main className="px-4 py-6 md:ml-60 md:px-8 md:py-8">{children}</main>
    </div>
  );
}

import Link from "next/link";
import { getStoreConfig, mpConfigured, transferConfigured } from "@/lib/store-config";

export async function StoreFooter() {
  const config = await getStoreConfig();
  const methods = [
    mpConfigured(config) ? "Mercado Pago" : null,
    transferConfigured(config) ? "Transferencia bancaria" : null,
  ].filter(Boolean);

  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-10 text-center text-sm text-neutral-500 md:flex-row md:justify-between md:text-left">
        <div>
          <p className="font-semibold uppercase tracking-[0.2em] text-neutral-300">
            {config.storeName}
          </p>
          {config.tagline && <p className="mt-1">{config.tagline}</p>}
        </div>
        <nav className="flex items-center gap-5">
          <Link href="/catalogo" className="transition-colors hover:text-white">
            Catálogo
          </Link>
          <Link href="/mis-pedidos" className="transition-colors hover:text-white">
            Mis pedidos
          </Link>
        </nav>
        <p>
          {methods.length > 0
            ? `Pagos: ${methods.join(" · ")}`
            : `© ${new Date().getFullYear()}`}
        </p>
      </div>
    </footer>
  );
}

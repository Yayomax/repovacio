import type { Metadata } from "next";
import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { getStoreConfig } from "@/lib/store-config";
import {
  ConfigEmailsForm,
  ConfigGeneralForm,
  ConfigPagosForm,
} from "@/components/admin/ConfigForms";
import { CategoriesManager } from "@/components/admin/CategoriesManager";
import { ShippingManager } from "@/components/admin/ShippingManager";

export const metadata: Metadata = { title: "Configuración" };

const SECTIONS = [
  { key: "general", label: "General", icon: "🏷" },
  { key: "pagos", label: "Pagos", icon: "💳" },
  { key: "envios", label: "Envíos", icon: "🚚" },
  { key: "emails", label: "Emails", icon: "✉" },
  { key: "catalogo", label: "Catálogo", icon: "🗂" },
] as const;

export default async function AdminConfigPage(props: {
  searchParams: Promise<{ seccion?: string }>;
}) {
  const { seccion } = await props.searchParams;
  const active =
    SECTIONS.find((section) => section.key === seccion)?.key ?? "general";

  const [config, shippingOptions, categories] = await Promise.all([
    getStoreConfig(),
    prisma.shippingOption.findMany({ orderBy: { position: "asc" } }),
    prisma.category.findMany({
      orderBy: { position: "asc" },
      include: { _count: { select: { products: true } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Configuración
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          Todo lo que se configura una sola vez, ordenado por tema. Las tareas
          diarias viven en Pedidos y Productos.
        </p>
      </div>

      <nav className="mt-6 flex gap-1.5 overflow-x-auto pb-1">
        {SECTIONS.map((section) => (
          <Link
            key={section.key}
            href={
              section.key === "general"
                ? "/admin/configuracion"
                : `/admin/configuracion?seccion=${section.key}`
            }
            className={`press shrink-0 rounded-full px-4 py-2 text-sm transition-colors duration-150 ${
              active === section.key
                ? "bg-white font-semibold text-black"
                : "border border-white/15 text-neutral-300 hover:border-white/50"
            }`}
          >
            <span aria-hidden className="mr-1.5">
              {section.icon}
            </span>
            {section.label}
          </Link>
        ))}
      </nav>

      <div key={active} className="card mt-5 animate-fade-in p-6 md:p-8">
        {active === "general" && (
          <ConfigGeneralForm
            initial={{
              storeName: config.storeName,
              tagline: config.tagline ?? "",
              currency: config.currency,
            }}
          />
        )}

        {active === "pagos" && (
          <ConfigPagosForm
            initial={{
              mpPublicKey: config.mpPublicKey ?? "",
              mpAccessToken: config.mpAccessToken ?? "",
              transferAlias: config.transferAlias ?? "",
              transferCbu: config.transferCbu ?? "",
              transferHolder: config.transferHolder ?? "",
              transferEmail: config.transferEmail ?? "",
              transferNotes: config.transferNotes ?? "",
            }}
          />
        )}

        {active === "envios" && (
          <ShippingManager
            options={shippingOptions.map((option) => ({
              id: option.id,
              name: option.name,
              description: option.description,
              priceCents: option.priceCents,
              active: option.active,
            }))}
          />
        )}

        {active === "emails" && (
          <ConfigEmailsForm
            initial={{
              smtpHost: config.smtpHost ?? "",
              smtpPort: config.smtpPort !== null ? String(config.smtpPort) : "",
              smtpUser: config.smtpUser ?? "",
              smtpPass: config.smtpPass ?? "",
              emailFrom: config.emailFrom ?? "",
              adminNotifyEmail: config.adminNotifyEmail ?? "",
            }}
          />
        )}

        {active === "catalogo" && (
          <CategoriesManager
            categories={categories.map((category) => ({
              id: category.id,
              name: category.name,
              productCount: category._count.products,
            }))}
          />
        )}
      </div>
    </div>
  );
}

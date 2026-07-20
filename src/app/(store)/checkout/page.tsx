import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  getStoreConfig,
  mpConfigured,
  transferConfigured,
} from "@/lib/store-config";
import { CheckoutForm } from "@/components/store/CheckoutForm";

export const metadata: Metadata = { title: "Finalizar compra" };

export default async function CheckoutPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [config, shippingOptions] = await Promise.all([
    getStoreConfig(),
    prisma.shippingOption.findMany({
      where: { active: true },
      orderBy: { position: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-12">
      <h1 className="animate-fade-up text-3xl font-semibold tracking-tight md:text-4xl">
        Finalizar compra
      </h1>
      <p className="mt-2 animate-fade-up text-neutral-400 [animation-delay:.1s]">
        Un solo paso: tus datos, el envío y cómo querés pagar.
      </p>

      <div className="mt-8 animate-fade-up [animation-delay:.15s]">
        <CheckoutForm
          defaults={{
            name: session.user.name ?? "",
            email: session.user.email ?? "",
          }}
          mpAvailable={mpConfigured(config)}
          transferAvailable={transferConfigured(config)}
          transferEmail={config.transferEmail}
          shippingOptions={shippingOptions.map((option) => ({
            id: option.id,
            name: option.name,
            description: option.description,
            priceCents: option.priceCents,
          }))}
        />
      </div>
    </div>
  );
}

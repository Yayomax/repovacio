import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getStoreConfig } from "@/lib/store-config";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/welcome");

  const [config, pendingOrders] = await Promise.all([
    getStoreConfig(),
    prisma.order.count({ where: { status: "PENDING" } }),
  ]);

  return (
    <AdminShell storeName={config.storeName} pendingOrders={pendingOrders}>
      {children}
    </AdminShell>
  );
}

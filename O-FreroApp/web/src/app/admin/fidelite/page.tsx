import type { Metadata } from "next";
import { connection } from "next/server";
import { LoyaltySettingsForm } from "@/components/admin/LoyaltySettingsForm";
import { PageTitle } from "@/components/admin/ui";
import { prisma } from "@/lib/db";
import { getSettings } from "@/server/settings";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Fidélité et réglages" };

export default async function AdminLoyaltyPage() {
  await requireAdmin();
  await connection();
  const [settings, products] = await Promise.all([
    getSettings(),
    prisma.product.findMany({ where: { isEditionOnly: false, category: { isPizza: true } }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return (
    <>
      <PageTitle title="Fidélité et réglages" />
      <LoyaltySettingsForm initial={settings} products={products} />
    </>
  );
}

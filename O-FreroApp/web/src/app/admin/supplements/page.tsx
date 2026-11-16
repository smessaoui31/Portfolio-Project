import type { Metadata } from "next";
import { connection } from "next/server";
import { SupplementsManager } from "@/components/admin/SupplementsManager";
import { PageTitle } from "@/components/admin/ui";
import { listSupplementsAdmin } from "@/server/admin/catalog";

export const metadata: Metadata = { title: "Suppléments" };

export default async function AdminSupplementsPage() {
  await connection();
  const supplements = await listSupplementsAdmin();
  return (
    <>
      <PageTitle title="Suppléments" />
      <SupplementsManager
        supplements={supplements.map((s) => ({ id: s.id, name: s.name, priceCents: s.priceCents, isActive: s.isActive, products: s._count.products }))}
      />
    </>
  );
}

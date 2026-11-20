import type { Metadata } from "next";
import { connection } from "next/server";
import { OptionGroupsManager } from "@/components/admin/OptionGroupsManager";
import { PageTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/session";
import { listOptionGroupsAdmin } from "@/server/admin/options";

export const metadata: Metadata = { title: "Choix" };

export default async function AdminChoicesPage() {
  await requireAdmin();
  await connection();
  const groups = await listOptionGroupsAdmin();
  return (
    <>
      <PageTitle title="Choix" />
      <OptionGroupsManager
        groups={groups.map((g) => ({
          id: g.id,
          name: g.name,
          minSelect: g.minSelect,
          maxSelect: g.maxSelect,
          products: g.products,
          options: g.options.map((o) => ({ id: o.id, name: o.name, priceCents: o.priceCents, isActive: o.isActive })),
        }))}
      />
    </>
  );
}

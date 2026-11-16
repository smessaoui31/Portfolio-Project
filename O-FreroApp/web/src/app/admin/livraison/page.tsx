import type { Metadata } from "next";
import { connection } from "next/server";
import { ZonesManager } from "@/components/admin/ZonesManager";
import { PageTitle } from "@/components/admin/ui";
import { listZonesAdmin } from "@/server/admin/settings";

export const metadata: Metadata = { title: "Livraison" };

export default async function AdminDeliveryPage() {
  await connection();
  const zones = await listZonesAdmin();
  return (
    <>
      <PageTitle title="Livraison" />
      <p className="mb-6 max-w-2xl text-sm text-muted-2">
        Une adresse est livrée si son code postal figure dans une zone active. Le minimum se calcule après la pizza offerte.
      </p>
      <ZonesManager zones={zones} />
    </>
  );
}

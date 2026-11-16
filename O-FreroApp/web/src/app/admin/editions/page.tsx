import type { Metadata } from "next";
import { connection } from "next/server";
import { EditionsManager, type EditionRow } from "@/components/admin/EditionsManager";
import { PageTitle } from "@/components/admin/ui";
import { now } from "@/lib/clock";
import { addDaysToKey, parisDateKey } from "@/lib/time";
import { prisma } from "@/lib/db";
import { listEditionsAdmin } from "@/server/admin/settings";

export const metadata: Metadata = { title: "Éditions" };

export default async function AdminEditionsPage() {
  await connection();
  const at = now().getTime();
  const [editions, products] = await Promise.all([
    listEditionsAdmin(),
    prisma.product.findMany({ where: { isEditionOnly: true, category: { isPizza: true } }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const rows: EditionRow[] = editions.map((e) => ({
    id: e.id,
    number: e.number,
    productId: e.product.id,
    productName: e.product.name,
    imageUrl: e.product.imageUrl,
    startDate: parisDateKey(e.startsAt),
    endDate: addDaysToKey(parisDateKey(e.endsAt), -1),
    brothersNote: e.brothersNote,
    state: e.endsAt.getTime() <= at ? "past" : e.startsAt.getTime() > at ? "upcoming" : "current",
    orders: e._count.orders,
  }));
  return (
    <>
      <PageTitle title="Éditions" />
      <p className="mb-6 max-w-2xl text-sm text-muted-2">
        Chaque édition dure de son premier à son dernier jour inclus, heure de Paris, et bascule toute seule. Entre deux éditions,
        l&apos;accueil met en avant la pizza choisie dans Fidélité.
      </p>
      <EditionsManager editions={rows} products={products} />
    </>
  );
}

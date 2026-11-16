import type { Metadata } from "next";
import { connection } from "next/server";
import { CategoriesManager } from "@/components/admin/CategoriesManager";
import { PageTitle } from "@/components/admin/ui";
import { listCategoriesAdmin } from "@/server/admin/catalog";

export const metadata: Metadata = { title: "Catégories" };

export default async function AdminCategoriesPage() {
  await connection();
  const categories = await listCategoriesAdmin();
  return (
    <>
      <PageTitle title="Catégories" />
      <p className="mb-6 max-w-2xl text-sm text-muted-2">
        L&apos;ordre ici est celui de la carte. Les catégories « Pizzas » rapportent des tampons et peuvent porter une édition.
      </p>
      <CategoriesManager categories={categories.map((c) => ({ id: c.id, name: c.name, isPizza: c.isPizza, products: c._count.products }))} />
    </>
  );
}

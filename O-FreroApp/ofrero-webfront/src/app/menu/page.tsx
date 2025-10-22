import { Suspense } from "react";
import CategoryFilter from "@/components/menu/CategoryFilter";
import ProductsSkeleton from "@/components/menu/ProductsSkeleton";
import ProductsGrid from "@/components/menu/ProductsGrid";

export const revalidate = 0;

export default function MenuPage({
  searchParams,
}: {
  searchParams: { category?: string; sort?: string };
}) {
  const category = searchParams?.category ?? null;
  const sort = searchParams?.sort ?? "name-asc";

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="mx-auto max-w-7xl px-4 pt-10 pb-6">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Notre carte</h1>
        <p className="mt-2 text-neutral-400">Pizzas maison, boissons et desserts.</p>

        <CategoryFilter />
      </header>

      <section className="mx-auto max-w-7xl px-4 pb-12">
        <Suspense fallback={<ProductsSkeleton count={6} />}>
        
          <ProductsGrid category={category} sort={sort} />
        </Suspense>
      </section>
    </main>
  );
}
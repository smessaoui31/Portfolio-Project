import AddToCartButton from "@/components/ui/AddToCartButton";

type Category = { id: string; name: string } | null;
type Product = {
  id: string;
  name: string;
  priceCents: number;
  description?: string | null;
  category?: Category;
};

async function fetchProducts(params: { category?: string | null; sort?: string | null }) {
  const base = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:5050";
  const url = new URL(`${base}/products`);
  if (params.category && params.category !== "all") url.searchParams.set("categoryId", params.category);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch products");
  const data = await res.json();
  const items: Product[] = Array.isArray(data) ? data : data.items ?? [];
  return items;
}

function sortProducts(items: Product[], sort: string | null) {
  if (!sort || sort === "name-asc") {
    return [...items].sort((a, b) => a.name.localeCompare(b.name));
  }
  if (sort === "price-asc") {
    return [...items].sort((a, b) => a.priceCents - b.priceCents);
  }
  if (sort === "price-desc") {
    return [...items].sort((a, b) => b.priceCents - a.priceCents);
  }
  return items;
}

export default async function ProductsGrid({ category, sort }: { category?: string | null; sort?: string | null }) {
  const items = await fetchProducts({ category, sort });
  const products = sortProducts(items, sort ?? null);

  if (products.length === 0) {
    return <div className="text-neutral-400">Aucun produit pour cette sélection.</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {products.map((p) => (
        <article
          key={p.id}
          className="bg-neutral-900/60 rounded-2xl border border-neutral-800 overflow-hidden hover:border-neutral-700 transition"
        >
          <div className="aspect-square bg-neutral-800/60 grid place-items-center text-6xl">🍕</div>
          <div className="p-5 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">{p.name}</h2>
              <div className="text-white font-bold">{(p.priceCents / 100).toFixed(2)} €</div>
            </div>

            {p.description && (
              <p className="text-sm text-neutral-400 line-clamp-2">{p.description}</p>
            )}

            {p.category && (
              <span className="inline-block mt-1 text-[11px] uppercase tracking-wide text-neutral-500">
                {p.category.name}
              </span>
            )}

            <AddToCartButton productId={p.id} />
          </div>
        </article>
      ))}
    </div>
  );
}
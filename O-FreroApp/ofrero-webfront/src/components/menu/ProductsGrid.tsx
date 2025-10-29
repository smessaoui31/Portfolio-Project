"use client";
import ProductCustomizeButton from "@/components/menu/ProductCustomizeButton";
import AddToCartButton from "@/components/theme/ui/AddToCartButton";
import type { Paginated, Product } from "@/types";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const PAGE_SIZE_FALLBACK = 9;

type ApiResponse = Paginated<Product>;

export default function ProductsGrid() {
  const params = useSearchParams();
  const router = useRouter();

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const page = parseInt(params.get("page") ?? "1", 10) || 1;
  const q = params.get("q") ?? "";
  const categoryId = params.get("categoryId") ?? "";
  const sort = params.get("sort") ?? "";
  const featured = params.get("featured") ?? "";
  const pageSize = parseInt(params.get("pageSize") ?? String(PAGE_SIZE_FALLBACK), 10);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchProducts() {
      try {
        setLoading(true);
        const qs = new URLSearchParams();
        if (q) qs.set("q", q);
        if (categoryId) qs.set("categoryId", categoryId);
        if (sort) qs.set("sort", sort);
        if (featured === "true") qs.set("featured", "true");
        qs.set("page", String(page));
        qs.set("pageSize", String(pageSize));

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:5050"}/products?${qs.toString()}`,
          { signal: controller.signal, cache: "no-store" }
        );
        const json = await res.json();
        setData(json);
      } catch (e) {
        if (!(e instanceof DOMException && e.name === "AbortError")) {
          console.error(e);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
    return () => controller.abort();
  }, [q, categoryId, sort, featured, page, pageSize]);

  if (loading && !data) {
    return <div className="text-neutral-400">Chargement…</div>;
  }

  const products = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / (data?.pageSize ?? PAGE_SIZE_FALLBACK)));

  return (
    <div className="space-y-6">
      {/* Grille */}
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <article
            key={p.id}
            className="bg-neutral-900/60 rounded-2xl border border-neutral-800 overflow-hidden hover:border-neutral-700 transition"
          >
            <div className="aspect-square bg-neutral-800/60 grid place-items-center text-6xl">
              🍕
            </div>
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

              {p.isFeatured && (
                <span className="ml-2 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-[10px]">
                  ⭐ Sélection
                </span>
              )}

              {/* Actions : Ajouter au panier + Personnaliser (côte à côte) */}
              <div className="mt-3 flex items-center gap-2">
                <AddToCartButton productId={p.id} className="flex-1" />
                <div className="flex-1">
                  <ProductCustomizeButton productId={p.id} priceCents={p.priceCents} />
                </div>
              </div>
            </div>
          </article>
        ))}

        {products.length === 0 && (
          <div className="col-span-full text-neutral-400">Aucun produit pour le moment.</div>
        )}
      </section>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-2">
          <PageBtn disabled={page <= 1} onClick={() => pushPage(page - 1)}>
            ← Précédent
          </PageBtn>
          <span className="text-neutral-400 text-sm">
            Page <span className="text-white">{page}</span> / {pageCount}
          </span>
          <PageBtn disabled={page >= pageCount} onClick={() => pushPage(page + 1)}>
            Suivant →
          </PageBtn>
        </div>
      )}
    </div>
  );

  function pushPage(next: number) {
    const p = new URLSearchParams(params.toString());
    p.set("page", String(next));
    router.push(`/menu?${p.toString()}`);
  }
}

function PageBtn({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`rounded-md border px-3 py-1.5 text-sm transition
        ${disabled
          ? "cursor-not-allowed border-neutral-900 text-neutral-600"
          : "border-neutral-800 text-neutral-200 hover:bg-neutral-800/60"}`}
    >
      {children}
    </button>
  );
}
// src/components/menu/ProductsGrid.tsx
"use client";
import Image from "next/image";
import ProductCustomizeButton from "@/components/menu/ProductCustomizeButton";
import AddToCartButton from "@/components/theme/ui/AddToCartButton";
import ProductQuickView from "@/components/menu/ProductQuickView";
import type { Paginated, Product } from "@/types";
import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye } from "lucide-react";

const PAGE_SIZE_FALLBACK = 9;

type ApiResponse = Paginated<Product>;

function normalizeAssetUrl(raw?: string) {
  if (!raw) return undefined;
  const v = raw.trim();
  if (!v) return undefined;
  if (/^https?:\/\//i.test(v)) return v;
  if (v.startsWith("/uploads/")) {
    const base = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:5050";
    return `${base}${v}`;
  }
  return v;
} 
const IMG_BY_NAME: Record<string, string> = {
  margherita: "/images/pizzas/margherita.jpg",
  cheesy : "/images/pizzas/4-fromages.jpg",
  pepperoni: "/images/pizzas/pepperoni.jpg",
  reine: "/images/pizzas/reine.jpg",
  savoyarde: "/images/pizzas/savoyarde.jpg",
  "bbq chicken": "/images/pizzas/bbq-chicken.jpg",
  "la audrey": "/images/pizzas/hawaiian.webp",
  "oasis tropical": "/images/pizzas/oasistrop.webp",
  "coca cola": "/images/pizzas/coca.jpg",
  "tiramisu caramel": "/images/pizzas/tiramisu.png",
  "cannoli": "/images/pizzas/cannoli.png",
  "7up mojito": "/images/pizzas/7-up-mojito.png",
};

function getProductImage(p: Product) {
  const fromDb =
    normalizeAssetUrl((p as any).imageURL) ||
    normalizeAssetUrl((p as any).imageUrl);
  if (fromDb) return fromDb;

  const key = (p.name || "").trim().toLowerCase();
  if (IMG_BY_NAME[key]) return IMG_BY_NAME[key];

  const cat = (p.category?.name || "").trim().toLowerCase();
  if (cat === "pizza") return "/images/pizzas/pizza-placeholder.jpg";
  if (cat === "boisson" || cat === "boissons" || cat === "drink" || cat === "drinks") {
    return "/images/drinks/drink-placeholder.jpg";
  }
  if (cat === "dessert" || cat === "desserts") {
    return "/images/desserts/dessert-placeholder.jpg";
  }

  return "/images/placeholder-generic.jpg";
}

export default function ProductsGrid() {
  const params = useSearchParams();
  const router = useRouter();

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const gridRef = useRef<HTMLDivElement>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

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

        // Scroll vers le haut lors du changement de filtre/page
        if (gridRef.current) {
          const offset = gridRef.current.offsetTop - 100;
          window.scrollTo({ top: offset, behavior: "smooth" });
        }
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

  const products = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / (data?.pageSize ?? PAGE_SIZE_FALLBACK)));

  // Skeleton Loading Component
  const SkeletonCard = () => (
    <div className="bg-neutral-900/60 rounded-2xl border border-neutral-800 overflow-hidden animate-pulse">
      <div className="relative aspect-square bg-neutral-800/60"></div>
      <div className="p-5 space-y-2">
        <div className="h-6 bg-neutral-800/60 rounded w-3/4"></div>
        <div className="h-4 bg-neutral-800/40 rounded w-full"></div>
        <div className="h-4 bg-neutral-800/40 rounded w-5/6"></div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="h-10 bg-neutral-800/60 rounded"></div>
          <div className="h-10 bg-neutral-800/60 rounded"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6" ref={gridRef}>
      {/* Compteur de résultats */}
      {!loading && total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-neutral-400"
        >
          <span className="text-white font-medium">{total}</span> {total > 1 ? "produits trouvés" : "produit trouvé"}
        </motion.div>
      )}

      {/* Grille */}
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          // Afficher les skeletons pendant le chargement
          Array.from({ length: pageSize }).map((_, i) => (
            <SkeletonCard key={`skeleton-${i}`} />
          ))
        ) : (
          // Afficher les produits une fois chargés avec animation
          <>
        {products.map((p, index) => {
          const isPizza = (p.category?.name ?? "").toLowerCase() === "pizza";
          return (
            <motion.article
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-neutral-900/60 rounded-2xl border border-neutral-800 overflow-hidden hover:border-neutral-700 transition"
            >
              {/* Image produit avec effet zoom */}
              <div className="relative aspect-square overflow-hidden bg-neutral-800/60 group/image">
                <Image
                  src={getProductImage(p)}
                  alt={p.name}
                  fill
                  sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover/image:scale-105"
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzI2MjYyNiIvPjwvc3ZnPg=="
                />
                {/* Quick view button */}
                <button
                  onClick={() => setQuickViewProduct(p)}
                  className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover/image:opacity-100 transition-opacity duration-300"
                >
                  <span className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-100 transition">
                    <Eye className="h-4 w-4" />
                    Vue rapide
                  </span>
                </button>
                <div className="pointer-events-none absolute bottom-3 left-3 rounded-full border border-white/20 bg-black/50 px-3 py-1 text-sm text-white backdrop-blur-sm">
                  {(p.priceCents / 100).toFixed(2)} €
                </div>
              </div>

              {/* Informations du produit */}
              <div className="p-5 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold text-white">{p.name}</h2>
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

                {/* Boutons d’action */}
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <AddToCartButton productId={p.id} />
                  {isPizza && (
                    <ProductCustomizeButton productId={p.id} priceCents={p.priceCents} />
                  )}
                </div>
              </div>
            </motion.article>
          );
        })}

          {products.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-neutral-400 text-lg mb-4">Aucun produit trouvé</p>
              <button
                onClick={() => {
                  const params = new URLSearchParams();
                  router.push(`/menu?${params.toString()}`);
                }}
                className="text-sm text-white underline hover:text-neutral-300"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}
          </>
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

      {/* Quick View Modal */}
      <ProductQuickView
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        getProductImage={getProductImage}
      />
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
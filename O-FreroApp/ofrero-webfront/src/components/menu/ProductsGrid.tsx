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
import { Eye, LayoutGrid, List, Settings2, Search } from "lucide-react";

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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
      {/* Barre d'outils avec compteur et toggle view */}
      {!loading && total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="text-sm text-neutral-400">
            <span className="text-white font-medium">{total}</span> {total > 1 ? "produits trouvés" : "produit trouvé"}
          </div>

          {/* Toggle Grid/List View */}
          <div className="flex items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-900/50 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                viewMode === 'grid'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              aria-label="Vue grille"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="sm:hidden md:inline">Grille</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              aria-label="Vue liste"
            >
              <List className="h-4 w-4" />
              <span className="sm:hidden md:inline">Liste</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Grille ou Liste responsive */}
      <section className={viewMode === 'grid'
        ? "grid grid-cols-1 gap-4 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 md:gap-6"
        : "flex flex-col gap-4"
      }>
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

          // Mode Liste
          if (viewMode === 'list') {
            return (
              <motion.article
                key={p.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                className="group flex flex-col sm:flex-row gap-3 sm:gap-4 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/60 p-3 sm:p-4 shadow-lg shadow-black/20 transition-all hover:border-neutral-700 hover:shadow-xl hover:shadow-white/5"
              >
                {/* Image compacte */}
                <div className="relative h-48 sm:h-32 sm:w-32 w-full shrink-0 overflow-hidden rounded-xl bg-neutral-800/60">
                  <Image
                    src={getProductImage(p)}
                    alt={p.name}
                    fill
                    sizes="128px"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  {p.isFeatured && (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-200 backdrop-blur-md">
                      <span className="text-emerald-300">⭐</span>
                    </span>
                  )}
                </div>

                {/* Informations */}
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-3">
                      <h2 className="text-base sm:text-lg font-semibold text-white">{p.name}</h2>
                      <div className="text-lg sm:text-xl font-bold text-white whitespace-nowrap">
                        {(p.priceCents / 100).toFixed(2)} €
                      </div>
                    </div>
                    {p.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-neutral-400">
                        {p.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      {p.category && (
                        <span className="inline-flex items-center rounded-md border border-neutral-700/60 bg-neutral-900/80 px-2 py-0.5 text-xs font-medium uppercase tracking-wider text-neutral-300">
                          {p.category.name}
                        </span>
                      )}
                      {isPizza && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-neutral-700/60 bg-neutral-900/80 px-2 py-0.5 text-xs text-neutral-400">
                          <Settings2 className="h-3 w-3" />
                          Personnalisable
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions en ligne */}
                  <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <AddToCartButton productId={p.id} productImage={getProductImage(p)} />
                    </div>
                    <div className="flex gap-2">
                      {isPizza && (
                        <div className="flex-1 sm:flex-none">
                          <ProductCustomizeButton productId={p.id} priceCents={p.priceCents} />
                        </div>
                      )}
                      <button
                        onClick={() => setQuickViewProduct(p)}
                        className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-2 text-neutral-400 transition hover:border-neutral-700 hover:text-white"
                        aria-label="Vue rapide"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          }

          // Mode Grille
          return (
            <motion.article
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="product-card-glow group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/60 shadow-lg shadow-black/20 transition-all hover:border-neutral-700 hover:shadow-2xl hover:shadow-white/5"
            >
              {/* Image produit avec effet zoom */}
              <div className="relative aspect-square overflow-hidden bg-neutral-800/60 group/image">
                <Image
                  src={getProductImage(p)}
                  alt={p.name}
                  fill
                  sizes="(min-width:1280px) 25vw, (min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover/image:scale-110"
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzI2MjYyNiIvPjwvc3ZnPg=="
                />

                {/* Badges empilés en haut à gauche */}
                <div className="absolute left-3 top-3 flex flex-col gap-2">
                  {p.isFeatured && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.05 }}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-200 shadow-lg backdrop-blur-md"
                    >
                      <span className="text-emerald-300">⭐</span>
                      Chef
                    </motion.span>
                  )}
                  {p.category && (
                    <span className="inline-flex items-center rounded-lg border border-neutral-700/60 bg-neutral-900/80 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-neutral-300 shadow-lg backdrop-blur-md">
                      {p.category.name}
                    </span>
                  )}
                </div>

                {/* Quick view button */}
                <button
                  onClick={() => setQuickViewProduct(p)}
                  className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity duration-300 group-hover/image:opacity-100"
                >
                  <span className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black shadow-xl transition hover:bg-neutral-100">
                    <Eye className="h-4 w-4" />
                    Vue rapide
                  </span>
                </button>

                {/* Prix repositionné en bas */}
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-8">
                  <div className="flex items-end justify-between">
                    <div className="text-2xl font-bold text-white">
                      {(p.priceCents / 100).toFixed(2)} €
                    </div>
                  </div>
                </div>
              </div>

              {/* Informations du produit */}
              <div className="flex flex-1 flex-col space-y-2 p-3 sm:p-4">
                <h2 className="line-clamp-1 text-sm sm:text-base font-semibold text-white">
                  {p.name}
                </h2>

                {p.description && (
                  <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-neutral-400">
                    {p.description}
                  </p>
                )}

                {/* Indicateur de personnalisation */}
                {isPizza && (
                  <div className="flex items-center gap-1 text-xs text-neutral-500">
                    <Settings2 className="h-3 w-3" />
                    <span>Personnalisable</span>
                  </div>
                )}

                {/* Boutons d'action */}
                <div className="mt-auto grid grid-cols-1 gap-2">
                  <AddToCartButton productId={p.id} productImage={getProductImage(p)} />
                  {isPizza && (
                    <ProductCustomizeButton productId={p.id} priceCents={p.priceCents} />
                  )}
                </div>
              </div>
            </motion.article>
          );
        })}

          {products.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="col-span-full mx-auto max-w-md"
            >
              <div className="rounded-3xl border border-neutral-800 bg-gradient-to-br from-neutral-900/80 to-neutral-900/40 p-8 text-center backdrop-blur-sm">
                {/* Icône */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-800/60 ring-4 ring-neutral-800/30"
                >
                  <Search className="h-10 w-10 text-neutral-500" strokeWidth={1.5} />
                </motion.div>

                {/* Message */}
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mb-2 text-xl font-bold text-white"
                >
                  Aucun produit trouvé
                </motion.h3>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mb-6 text-sm text-neutral-400"
                >
                  Essayez de modifier vos filtres ou de réinitialiser la recherche
                </motion.p>

                {/* Bouton */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    const params = new URLSearchParams();
                    router.push(`/menu?${params.toString()}`);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-black shadow-lg shadow-white/10 transition-all hover:shadow-xl hover:shadow-white/20"
                >
                  Réinitialiser les filtres
                </motion.button>
              </div>
            </motion.div>
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
      {quickViewProduct && (
        <ProductQuickView
          key={quickViewProduct.id}
          product={quickViewProduct}
          isOpen={true}
          onClose={() => setQuickViewProduct(null)}
          getProductImage={getProductImage}
        />
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
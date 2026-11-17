import { formatEuros } from "@/lib/money";
import type { MenuProduct } from "@/server/catalog";
import { ProductImage } from "./ProductImage";

export function ProductRow({ product, onSelect }: { product: MenuProduct; onSelect: (product: MenuProduct) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(product)}
      className="group flex w-full items-center gap-4 border-b border-line py-4 text-left transition hover:bg-surface/40"
      aria-label={`${product.name}, ${formatEuros(product.unitPriceCents)}${product.soldOut ? ", épuisé" : ""}. Personnaliser et ajouter`}
    >
      <ProductImage src={product.imageUrl} alt="" size={64} className={product.soldOut ? "opacity-40 grayscale" : ""} />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{product.name}</span>
        {product.description ? <span className="mt-0.5 block text-sm text-muted line-clamp-2">{product.description}</span> : null}
      </span>
      <span className="text-right">
        {product.discountPercent > 0 ? (
          <span className="block text-xs text-muted line-through tabular-nums">{formatEuros(product.priceCents)}</span>
        ) : null}
        <span className="block font-semibold tabular-nums">{product.soldOut ? "Épuisé" : formatEuros(product.unitPriceCents)}</span>
      </span>
      <span
        aria-hidden
        className="grid size-9 shrink-0 place-items-center rounded-full border border-line-2 bg-surface-2 text-lg transition group-hover:border-ember group-hover:text-ember"
      >
        +
      </span>
    </button>
  );
}

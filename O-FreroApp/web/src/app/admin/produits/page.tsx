import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { PageTitle } from "@/components/admin/ui";
import { ProductImage } from "@/components/menu/ProductImage";
import { unitPriceCents } from "@/domain/pricing";
import { formatEuros } from "@/lib/money";
import { listProductsAdmin } from "@/server/admin/catalog";

export const metadata: Metadata = { title: "Produits" };

export default async function AdminProductsPage() {
  await connection();
  const products = await listProductsAdmin();
  return (
    <>
      <PageTitle title="Produits">
        <Link href="/admin/produits/nouveau" className="rounded-xl bg-ember px-4 py-2 text-sm font-bold text-ember-ink">
          Nouveau produit
        </Link>
      </PageTitle>
      <ul className="divide-y divide-line rounded-2xl border border-line">
        {products.map((p) => (
          <li key={p.id}>
            <Link href={`/admin/produits/${p.id}`} className="flex items-center gap-4 px-4 py-3 transition hover:bg-surface">
              <ProductImage src={p.imageUrl} alt="" size={44} className={p.isAvailable ? "" : "opacity-40 grayscale"} />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{p.name}</span>
                <span className="block text-xs text-muted">
                  {p.category?.name ?? "Sans catégorie"}
                  {p.isEditionOnly ? " · Édition" : ""}
                  {!p.isAvailable ? " · Indisponible" : ""}
                  {p.stockQuantity !== null ? ` · Stock ${p.stockQuantity}` : ""}
                  {p.discountPercent > 0 ? ` · Remise ${p.discountPercent} %` : ""}
                </span>
              </span>
              <span className="font-semibold tabular-nums">{formatEuros(unitPriceCents(p))}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

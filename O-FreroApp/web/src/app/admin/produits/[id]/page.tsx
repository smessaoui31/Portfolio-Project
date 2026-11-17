import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ProductForm, type ProductFormValue } from "@/components/admin/ProductForm";
import { getProductAdmin, listCategoriesAdmin, listSupplementsAdmin } from "@/server/admin/catalog";
import { listPublicImages } from "@/server/admin/images";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Produit" };

const euros = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");

export default async function AdminProductPage({ params }: PageProps<"/admin/produits/[id]">) {
  await requireAdmin();
  await connection();
  const { id } = await params;
  const [categories, supplements, images] = await Promise.all([listCategoriesAdmin(), listSupplementsAdmin(), listPublicImages()]);

  let initial: ProductFormValue = {
    name: "",
    description: "",
    price: "",
    discountPercent: "0",
    categoryId: categories.find((c) => c.isPizza)?.id ?? "",
    imageUrl: "",
    isAvailable: true,
    stock: "",
    isEditionOnly: false,
    supplementIds: [],
  };
  if (id !== "nouveau") {
    const product = await getProductAdmin(id);
    if (!product) notFound();
    initial = {
      id: product.id,
      name: product.name,
      description: product.description ?? "",
      price: euros(product.priceCents),
      discountPercent: String(product.discountPercent),
      categoryId: product.categoryId ?? "",
      imageUrl: product.imageUrl ?? "",
      isAvailable: product.isAvailable,
      stock: product.stockQuantity === null ? "" : String(product.stockQuantity),
      isEditionOnly: product.isEditionOnly,
      supplementIds: product.supplements.map((s) => s.supplementId),
    };
  }

  return (
    <>
      <Link href="/admin/produits" className="text-sm text-muted-2 hover:text-fg">
        ← Produits
      </Link>
      <h1 className="font-display mt-4 mb-8 text-5xl">{id === "nouveau" ? "Nouveau produit" : initial.name}</h1>
      <ProductForm
        initial={initial}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        supplements={supplements.map((s) => ({ id: s.id, name: s.name, priceCents: s.priceCents }))}
        images={images}
      />
    </>
  );
}

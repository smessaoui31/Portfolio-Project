// src/app/admin/products/new/page.tsx
"use client";

import { useRouter } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import type { AdminProduct } from "@/types/admin";

export default function AdminProductCreatePage() {
  const router = useRouter();

  function handleSaved(p: AdminProduct) {
    router.push(`/admin/products/${p.id}`);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-white">Nouveau produit</h1>
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
        <ProductForm mode="create" onSaved={handleSaved} />
      </div>
    </div>
  );
}
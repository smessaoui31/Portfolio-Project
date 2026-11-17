"use server";

import { requireAdmin } from "@/lib/session";
import {
  deleteCategory,
  deleteProduct,
  deleteSupplement,
  reorderCategories,
  upsertCategory,
  upsertProduct,
  upsertSupplement,
  type ProductInput,
} from "@/server/admin/catalog";

export async function saveProductAction(input: ProductInput) {
  await requireAdmin();
  return upsertProduct(input);
}

export async function deleteProductAction(id: string) {
  await requireAdmin();
  return deleteProduct(id);
}

export async function saveCategoryAction(input: { id?: string; name: string; description?: string; isPizza: boolean }) {
  await requireAdmin();
  return upsertCategory(input);
}

export async function reorderCategoriesAction(ids: string[]) {
  await requireAdmin();
  await reorderCategories(ids);
}

export async function deleteCategoryAction(id: string) {
  await requireAdmin();
  return deleteCategory(id);
}

export async function saveSupplementAction(input: { id?: string; name: string; priceCents: number; isActive: boolean }) {
  await requireAdmin();
  return upsertSupplement(input);
}

export async function deleteSupplementAction(id: string) {
  await requireAdmin();
  return deleteSupplement(id);
}

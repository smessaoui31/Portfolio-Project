export type AdminCategory = { id: string; name: string };
export type AdminProduct = {
  id: string;
  name: string;
  description?: string | null;
  priceCents: number;
  categoryId?: string | null;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  category?: { id: string; name: string } | null;
};
export type AdminProductListResponse = {
  page: number;
  pageSize: number;
  total: number;
  items: AdminProduct[];
};
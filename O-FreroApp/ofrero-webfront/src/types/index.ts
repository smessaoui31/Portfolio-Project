export type Category = {
  id: string;
  name: string;
};

export type Product = {
  id: string;
  name: string;
  priceCents: number;
  description?: string | null;
  category?: Category | null;
  isFeatured?: boolean;
};

export type Paginated<T> = {
  page: number;
  pageSize: number;
  total: number;
  items: T[];
};
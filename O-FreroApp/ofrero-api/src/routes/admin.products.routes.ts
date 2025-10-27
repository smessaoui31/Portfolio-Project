import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAuth, requireAdmin, AuthRequest } from "../middleware/auth";

export const adminProductsRouter = Router();

/* ---------- helpers pagination/tri ---------- */
function parsePagination(query: any) {
  const page = Math.max(parseInt(String(query.page ?? "1"), 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(String(query.pageSize ?? "20"), 10) || 20, 1), 100);
  const skip = (page - 1) * pageSize;
  const take = pageSize;
  return { page, pageSize, skip, take };
}
function parseSort(query: any): Prisma.ProductOrderByWithRelationInput {
  const s = String(query.sort ?? "").toLowerCase();
  if (s.startsWith("price")) return { priceCents: s.endsWith("desc") ? "desc" : "asc" };
  if (s.startsWith("name")) return { name: s.endsWith("desc") ? "desc" : "asc" };
  if (s.startsWith("createdat")) return { createdAt: s.endsWith("desc") ? "desc" : "asc" };
  return { createdAt: "desc" };
}

/* ---------- Zod schemas ---------- */
const UpsertProductSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  priceCents: z.number().int().min(0),
  categoryId: z.string().optional().nullable(),
  isFeatured: z.boolean().optional().default(false),
});

/* ---------- GET /admin/products ---------- */
adminProductsRouter.get(
  "/products",
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res) => {
    const { page, pageSize, skip, take } = parsePagination(req.query);
    const orderBy = parseSort(req.query);

    const q = (req.query.q as string | undefined)?.trim();
    const categoryId = (req.query.categoryId as string | undefined)?.trim() || undefined;
    const featured = (req.query.featured as string | undefined)?.toLowerCase();

    const where: Prisma.ProductWhereInput = {
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(featured === "true" ? { isFeatured: true } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take,
        include: { category: { select: { id: true, name: true } } },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({ page, pageSize, total, items });
  }
);

/* ---------- GET /admin/products/:id ---------- */
adminProductsRouter.get(
  "/products/:id",
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res) => {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { category: { select: { id: true, name: true } } },
    });
    if (!product) return res.status(404).json({ error: "Not found" });
    res.json(product);
  }
);

/* ---------- POST /admin/products (create) ---------- */
adminProductsRouter.post(
  "/products",
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res) => {
    const parsed = UpsertProductSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });

    if (parsed.data.categoryId) {
      const cat = await prisma.category.findUnique({ where: { id: parsed.data.categoryId } });
      if (!cat) return res.status(404).json({ error: "Category not found" });
    }

    const created = await prisma.product.create({ data: parsed.data });
    res.status(201).json(created);
  }
);

/* ---------- PUT /admin/products/:id (update) ---------- */
adminProductsRouter.put(
  "/products/:id",
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res) => {
    const parsed = UpsertProductSchema.partial().safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });

    if (parsed.data.categoryId) {
      const cat = await prisma.category.findUnique({ where: { id: parsed.data.categoryId } });
      if (!cat) return res.status(404).json({ error: "Category not found" });
    }

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: parsed.data,
    });
    res.json(updated);
  }
);

/* ---------- DELETE /admin/products/:id ---------- */
adminProductsRouter.delete(
  "/products/:id",
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res) => {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  }
);

/* ---------- PATCH /admin/products/:id/featured (toggle) ---------- */
adminProductsRouter.patch(
  "/products/:id/featured",
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res) => {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ error: "Not found" });
    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: { isFeatured: !product.isFeatured },
    });
    res.json(updated);
  }
);
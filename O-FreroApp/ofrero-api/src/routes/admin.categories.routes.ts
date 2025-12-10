import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireAdmin, AuthRequest } from "../middleware/auth";

export const adminCategoriesRouter = Router();

/* ---------- Zod schemas ---------- */
const CategorySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  displayOrder: z.number().int().default(0),
});

/* ---------- GET /admin/categories ---------- */
adminCategoriesRouter.get(
  "/categories",
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res) => {
    const categories = await prisma.category.findMany({
      orderBy: { displayOrder: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
    res.json(categories);
  }
);

/* ---------- GET /admin/categories/:id ---------- */
adminCategoriesRouter.get(
  "/categories/:id",
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res) => {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
    if (!category) return res.status(404).json({ error: "Category not found" });
    res.json(category);
  }
);

/* ---------- POST /admin/categories (create) ---------- */
adminCategoriesRouter.post(
  "/categories",
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res) => {
    const parsed = CategorySchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });

    const created = await prisma.category.create({ data: parsed.data });
    res.status(201).json(created);
  }
);

/* ---------- PUT /admin/categories/:id (update) ---------- */
adminCategoriesRouter.put(
  "/categories/:id",
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res) => {
    const parsed = CategorySchema.partial().safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });

    const updated = await prisma.category.update({
      where: { id: req.params.id },
      data: parsed.data,
    });
    res.json(updated);
  }
);

/* ---------- DELETE /admin/categories/:id ---------- */
adminCategoriesRouter.delete(
  "/categories/:id",
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res) => {
    // Check if category has products
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { products: true } } },
    });

    if (!category) return res.status(404).json({ error: "Category not found" });

    if (category._count.products > 0) {
      return res.status(400).json({
        error: "Cannot delete category with products",
        productsCount: category._count.products,
      });
    }

    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  }
);

/* ---------- PATCH /admin/categories/reorder (bulk reorder) ---------- */
adminCategoriesRouter.patch(
  "/categories/reorder",
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res) => {
    const { categories } = req.body as { categories: { id: string; displayOrder: number }[] };

    if (!Array.isArray(categories)) {
      return res.status(400).json({ error: "Invalid body: categories must be an array" });
    }

    // Update all categories in a transaction
    await prisma.$transaction(
      categories.map((cat) =>
        prisma.category.update({
          where: { id: cat.id },
          data: { displayOrder: cat.displayOrder },
        })
      )
    );

    res.json({ ok: true });
  }
);

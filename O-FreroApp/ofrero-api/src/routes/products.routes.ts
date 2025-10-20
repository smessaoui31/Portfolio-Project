// src/routes/products.routes.ts
import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAuth, requireAdmin } from "../middleware/auth";

export const productsRouter = Router();

/* ----------------------------------------------------------------------------
 * Schéma de validation des query params (pagination, filtres, tri)
 * --------------------------------------------------------------------------*/
const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
  q: z.string().trim().optional(),
  categoryId: z.string().trim().optional(),
  sort: z
    .enum(["name", "priceAsc", "priceDesc", "createdDesc"])
    .default("name")
    .optional(),
});

/* ----------------------------------------------------------------------------
 * Utils : construction du where/orderBy Prisma selon les filtres
 * --------------------------------------------------------------------------*/
function buildWhere(q?: string, categoryId?: string): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {};
  if (q && q.length > 0) {
    where.name = { contains: q, mode: "insensitive" };
  }
  if (categoryId && categoryId.length > 0) {
    where.categoryId = categoryId;
  }
  return where;
}

function buildOrderBy(sort?: string): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case "priceAsc":
      return { priceCents: "asc" };
    case "priceDesc":
      return { priceCents: "desc" };
    case "createdDesc":
      return { createdAt: "desc" };
    case "name":
    default:
      return { name: "asc" };
  }
}

/* ----------------------------------------------------------------------------
 * GET /products
 * Liste paginée + filtre texte (q) + filtre catégorie (categoryId) + tri
 * Réponse : { data: Product[], meta: { page, pageSize, total, totalPages } }
 * --------------------------------------------------------------------------*/
productsRouter.get("/", async (req, res) => {
  const parsed = QuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "Paramètres invalides", details: parsed.error.flatten() });
  }

  const { page, pageSize, q, categoryId, sort } = parsed.data;
  const where = buildWhere(q, categoryId);
  const orderBy = buildOrderBy(sort);
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const [total, data] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take,
      include: { category: { select: { id: true, name: true } } },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  res.json({
    data,
    meta: { page, pageSize, total, totalPages },
  });
});

/* ----------------------------------------------------------------------------
 * GET /products/:id
 * Détail d’un produit
 * --------------------------------------------------------------------------*/
productsRouter.get("/:id", async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { category: { select: { id: true, name: true } } },
  });
  if (!product) return res.status(404).json({ error: "Not found" });
  res.json(product);
});

/* ----------------------------------------------------------------------------
 * GET /products/by-category/:id
 * Variante pratique : filtre forcé sur une catégorie + pagination/recherche/tri
 * --------------------------------------------------------------------------*/
productsRouter.get("/by-category/:id", async (req, res) => {
  const parsed = QuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "Paramètres invalides", details: parsed.error.flatten() });
  }
  const { page, pageSize, q, sort } = parsed.data;
  const categoryId = req.params.id;

  // Vérifie que la catégorie existe (optionnel mais plus clair côté client)
  const cat = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!cat) return res.status(404).json({ error: "Category not found" });

  const where = buildWhere(q, categoryId);
  const orderBy = buildOrderBy(sort);
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const [total, data] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take,
      include: { category: { select: { id: true, name: true } } },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  res.json({
    category: { id: cat.id, name: cat.name },
    data,
    meta: { page, pageSize, total, totalPages },
  });
});

/* ----------------------------------------------------------------------------
 * POST /products (admin)
 * Création d’un produit
 * --------------------------------------------------------------------------*/
const NewProductSchema = z.object({
  name: z.string().min(2),
  priceCents: z.number().int().min(0),
  description: z.string().optional(),
  categoryId: z.string().optional().nullable(),
});

productsRouter.post("/", requireAuth, requireAdmin, async (req, res) => {
  const parsed = NewProductSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
  }

  const { categoryId, ...rest } = parsed.data;

  if (categoryId) {
    const exists = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!exists) return res.status(404).json({ error: "Category not found" });
  }

  const product = await prisma.product.create({
    data: { ...rest, categoryId: categoryId ?? null },
  });

  res.status(201).json(product);
});

/* ----------------------------------------------------------------------------
 * PATCH /products/:id (admin)
 * Mise à jour partielle d’un produit
 * --------------------------------------------------------------------------*/
const UpdateProductSchema = z.object({
  name: z.string().min(2).optional(),
  priceCents: z.number().int().min(0).optional(),
  description: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
});

productsRouter.patch("/:id", requireAuth, requireAdmin, async (req, res) => {
  const parsed = UpdateProductSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
  }

  if (parsed.data.categoryId) {
    const exists = await prisma.category.findUnique({ where: { id: parsed.data.categoryId } });
    if (!exists) return res.status(404).json({ error: "Category not found" });
  }

  try {
    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: parsed.data,
    });
    res.json(updated);
  } catch {
    res.status(404).json({ error: "Product not found" });
  }
});

/* ----------------------------------------------------------------------------
 * DELETE /products/:id (admin)
 * Suppression d’un produit
 * --------------------------------------------------------------------------*/
productsRouter.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const deleted = await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ deleted });
  } catch {
    res.status(404).json({ error: "Product not found" });
  }
});
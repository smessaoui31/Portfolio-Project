import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma"; // Connexion à la DB Prisma
import { requireAuth, requireAdmin } from "../middleware/auth";

export const productsRouter = Router();

/**
 * GET /products
 * Liste tous les produits (avec recherche optionnelle)
 * + filtre catégorie (?categoryId=)
 * + pagination (?page=&pageSize=)
 */
productsRouter.get("/", async (req, res) => {
  const q = (req.query.q as string | undefined)?.trim();
  const categoryId = (req.query.categoryId as string | undefined)?.trim();

  const page = Math.max(parseInt(String(req.query.page ?? "1"), 10) || 1, 1);
  const pageSize = Math.min(
    Math.max(parseInt(String(req.query.pageSize ?? "20"), 10) || 20, 1),
    100
  );
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const where: Prisma.ProductWhereInput = {
    ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    ...(categoryId ? { categoryId } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { name: "asc" },
      include: { category: { select: { id: true, name: true } } },
      skip,
      take,
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    items,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  });
});

/**
 * GET /products/:id
 * Obtenir un produit par ID
 */
productsRouter.get("/:id", async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { category: { select: { id: true, name: true } } },
  });
  if (!product) return res.status(404).json({ error: "Not found" });
  res.json(product);
});

/**
 * POST /products
 * Création d’un nouveau produit (admin uniquement)
 */
const NewProductSchema = z.object({
  name: z.string().min(2),
  priceCents: z.number().int().min(0),
  description: z.string().optional(),
  categoryId: z.string().optional().nullable(),
});

productsRouter.post("/", requireAuth, requireAdmin, async (req, res) => {
  const parsed = NewProductSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });

  // Validation catégorie (si fournie)
  if (parsed.data.categoryId) {
    const cat = await prisma.category.findUnique({ where: { id: parsed.data.categoryId } });
    if (!cat) return res.status(404).json({ error: "Category not found" });
  }

  const product = await prisma.product.create({ data: parsed.data });
  res.status(201).json(product);
});

/**
 * PATCH /products/:id
 * Mise à jour partielle d’un produit (admin uniquement)
 */
const UpdateProductSchema = z.object({
  name: z.string().min(2).optional(),
  priceCents: z.number().int().min(0).optional(),
  description: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
});

productsRouter.patch("/:id", requireAuth, requireAdmin, async (req, res) => {
  const parsed = UpdateProductSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });

  if (parsed.data.categoryId !== undefined && parsed.data.categoryId !== null) {
    const cat = await prisma.category.findUnique({ where: { id: parsed.data.categoryId } });
    if (!cat) return res.status(404).json({ error: "Category not found" });
  }

  try {
    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: parsed.data,
      include: { category: { select: { id: true, name: true } } },
    });
    res.json(updated);
  } catch {
    res.status(404).json({ error: "Product not found" });
  }
});

/**
 * DELETE /products/:id
 * Suppression d’un produit (admin uniquement)
 */
productsRouter.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const deleted = await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ deleted });
  } catch {
    res.status(404).json({ error: "Product not found" });
  }
});

/**
 * POST /products/seed
 * Crée 5 pizzas de démonstration (admin uniquement)
 */
productsRouter.post("/seed", requireAuth, requireAdmin, async (_req, res) => {
  // Upsert catégorie "Pizza" (créée si elle n'existe pas)
  const pizzaCategory = await prisma.category.upsert({
    where: { name: "Pizza" },
    update: {},
    create: { name: "Pizza" },
    select: { id: true },
  });

  const data = [
    {
      name: "Pizza Margherita",
      description: "Tomate, mozzarella, basilic",
      priceCents: 950,
      categoryId: pizzaCategory.id,
    },
    {
      name: "Pizza Reine",
      description: "Jambon, champignons, mozzarella",
      priceCents: 1150,
      categoryId: pizzaCategory.id,
    },
    {
      name: "Pizza 4 Fromages",
      description: "Mozzarella, gorgonzola, parmesan, emmental",
      priceCents: 1250,
      categoryId: pizzaCategory.id,
    },
    {
      name: "Pizza Diavola",
      description: "Pepperoni piquant, olives noires",
      priceCents: 1300,
      categoryId: pizzaCategory.id,
    },
    {
      name: "Pizza O’Frero Spéciale",
      description: "Chèvre, viande hachée, oignons caramélisés, sauce BBQ",
      priceCents: 1450,
      categoryId: pizzaCategory.id,
    },
  ];

  try {
    const created = await prisma.product.createMany({ data });
    res.status(201).json({
      message: `🍕 ${created.count} pizzas ajoutées à la catégorie "Pizza"`,
      count: created.count,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur lors de la création des pizzas" });
  }
});

/**
 * PATCH /products/fix-attach-pizzas
 * Attache tous les produits contenant "pizza" à la catégorie "Pizza"
 */
productsRouter.patch("/fix-attach-pizzas", requireAuth, requireAdmin, async (_req, res) => {
  const cat = await prisma.category.upsert({
    where: { name: "Pizza" },
    update: {},
    create: { name: "Pizza" },
    select: { id: true },
  });

  const updated = await prisma.product.updateMany({
    where: {
      categoryId: null,
      name: { contains: "pizza", mode: "insensitive" },
    },
    data: { categoryId: cat.id },
  });

  res.json({
    message: `🔗 ${updated.count} produits attachés à la catégorie "Pizza"`,
    updated: updated.count,
  });
});
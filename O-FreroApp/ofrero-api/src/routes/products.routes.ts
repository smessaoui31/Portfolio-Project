import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma"; // nouveau : connexion à la DB Prisma
import { requireAuth, requireAdmin } from "../middleware/auth";

export const productsRouter = Router();

//  Remplace PRODUCTS par requêtes Prisma
productsRouter.get("/", async (req, res) => {
  const q = (req.query.q as string | undefined)?.trim();
  const where: Prisma.ProductWhereInput | undefined = q ? { name: { contains: q, mode: "insensitive" } } : undefined;

  const products = await prisma.product.findMany({
    where,
    orderBy: { name: "asc" },
    include: { category: { select: { id: true, name: true } } }, //  ajout
  });

  res.json(products);
});

// Même logique, mais findUnique via Prisma
productsRouter.get("/:id", async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { category: { select: { id: true, name: true } } },
  });
  if (!product) return res.status(404).json({ error: "Not found" });
  res.json(product);
});

// Création produit → via Prisma au lieu de PRODUCTS.push
const NewProductSchema = z.object({
  name: z.string().min(2),
  priceCents: z.number().int().min(0),
  description: z.string().optional(),
  categoryId: z.string().optional().nullable(),
});

productsRouter.post("/", requireAuth, requireAdmin, async (req, res) => {
  const parsed = NewProductSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });

  // validation catégorie (si fournie)
  if (parsed.data.categoryId) {
    const cat = await prisma.category.findUnique({ where: { id: parsed.data.categoryId } });
    if (!cat) return res.status(404).json({ error: "Category not found" });
  }

  const product = await prisma.product.create({ data: parsed.data }); // création via Prisma
  res.status(201).json(product);
});
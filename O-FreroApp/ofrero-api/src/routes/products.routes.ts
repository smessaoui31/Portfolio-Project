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

/**
 * POST /products/seed
 * Crée 5 pizzas de démo (réservé aux admins)
 */
productsRouter.post("/seed", requireAuth, requireAdmin, async (_req, res) => {
  // (optionnel) rattacher à la catégorie "Pizzas" si elle existe
  const pizzaCategory = await prisma.category.findFirst({
    where: { name: { equals: "Pizzas", mode: "insensitive" } },
    select: { id: true },
  });

  const data = [
    {
      name: "Pizza Margherita",
      description: "Tomate, mozzarella, basilic",
      priceCents: 950,
      categoryId: pizzaCategory?.id ?? null,
    },
    {
      name: "Pizza Reine",
      description: "Jambon, champignons, mozzarella",
      priceCents: 1150,
      categoryId: pizzaCategory?.id ?? null,
    },
    {
      name: "Pizza 4 Fromages",
      description: "Mozzarella, gorgonzola, parmesan, emmental",
      priceCents: 1250,
      categoryId: pizzaCategory?.id ?? null,
    },
    {
      name: "Pizza Diavola",
      description: "Pepperoni piquant, olives noires",
      priceCents: 1300,
      categoryId: pizzaCategory?.id ?? null,
    },
    {
      name: "Pizza O’Frero Spéciale",
      description: "Chèvre, viande hachée, oignons caramélisés, sauce BBQ",
      priceCents: 1450,
      categoryId: pizzaCategory?.id ?? null,
    },
  ];

  try {
    const created = await prisma.product.createMany({ data });
    res.status(201).json({
      message: `🍕 ${created.count} pizzas ajoutées`,
      count: created.count,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur lors de la création des pizzas" });
  }
});
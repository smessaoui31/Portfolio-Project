import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireAdmin } from "../middleware/auth";

export const categoriesRouter = Router();

/**
 * GET /categories
 * Liste toutes les catégories par le name
 */
categoriesRouter.get("/", async (_req, res) => {
  const cats = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
  res.json(cats);
});

/**
 * GET /categories/:id
 * Détail d’une catégorie
 */
categoriesRouter.get("/:id", async (req, res) => {
  const cat = await prisma.category.findUnique({ where: { id: req.params.id } });
  if (!cat) return res.status(404).json({ error: "Not found" });
  res.json(cat);
});

/**
 * POST /categories
 * Créer une catégorie (admin)
 */
const NewCategorySchema = z.object({
  name: z.string().min(2),
});

categoriesRouter.post("/", requireAuth, requireAdmin, async (req, res) => {
  const parsed = NewCategorySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });

  const cat = await prisma.category.create({ data: parsed.data });
  res.status(201).json(cat);
});

/**
 * POST /categories/seed
 * Crée / upsert des catégories par défaut (admin)
 * (Pizza, Tex-Mex, Desserts, Calzones, Pizzanini)
 */
categoriesRouter.post("/seed", requireAuth, requireAdmin, async (_req, res) => {
  const names = ["Pizza", "Tex-Mex", "Desserts", "Calzones", "Pizzanini"];

  const results = await Promise.all(
    names.map((name) =>
      prisma.category.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );

  res.status(201).json({
    message: "Catégories seeded",
    count: results.length,
    categories: results,
  });
});
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireAdmin } from "../middleware/auth";

export const categoriesRouter = Router();

/** Schémas */
const NewCategorySchema = z.object({
  name: z.string().min(2),
});
const UpdateCategorySchema = z.object({
  name: z.string().min(2),
});

/**
 * GET /categories
 * Lister toutes les catégories (tri alphabétique)
 */
categoriesRouter.get("/", async (_req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
  res.json(categories);
});

/**
 * POST /categories (admin)
 * Créer une catégorie
 */
categoriesRouter.post("/", requireAuth, requireAdmin, async (req, res) => {
  const parsed = NewCategorySchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Corps invalide", details: parsed.error.flatten() });

  try {
    const created = await prisma.category.create({ data: parsed.data });
    res.status(201).json(created);
  } catch (e: any) {
    // unique constraint sur name
    if (e?.code === "P2002") {
      return res.status(409).json({ error: "Nom déjà existant" });
    }
    console.error(e);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * GET /categories/:id?withProducts=true|false
 * Obtenir une catégorie (+ éventuellement ses produits)
 */
categoriesRouter.get("/:id", async (req, res) => {
  const withProducts = String(req.query.withProducts ?? "false").toLowerCase() === "true";

  const category = await prisma.category.findUnique({
    where: { id: req.params.id },
    include: withProducts
      ? {
          products: {
            orderBy: { name: "asc" },
            select: { id: true, name: true, priceCents: true, description: true },
          },
        }
      : undefined,
  });

  if (!category) return res.status(404).json({ error: "Catégorie introuvable" });
  res.json(category);
});

/**
 * PATCH /categories/:id (admin)
 * Renommer une catégorie
 */
categoriesRouter.patch("/:id", requireAuth, requireAdmin, async (req, res) => {
  const parsed = UpdateCategorySchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Corps invalide", details: parsed.error.flatten() });

  try {
    const updated = await prisma.category.update({
      where: { id: req.params.id },
      data: parsed.data,
    });
    res.json(updated);
  } catch (e: any) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Catégorie introuvable" });
    if (e?.code === "P2002") return res.status(409).json({ error: "Nom déjà existant" });
    console.error(e);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * DELETE /categories/:id (admin)
 * Supprimer une catégorie
 */
categoriesRouter.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const deleted = await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ deleted });
  } catch (e: any) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Catégorie introuvable" });
    console.error(e);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * POST /categories/seed (admin)
 * Ajoute Pizza, Tex-Mex, Desserts, Calzones, Pizzanini (idempotent)
 */
categoriesRouter.post("/seed", requireAuth, requireAdmin, async (_req, res) => {
  const names = ["Pizza", "Tex-Mex", "Desserts", "Calzones", "Pizzanini"];
  let count = 0;

  for (const name of names) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    count++;
  }

  res.status(201).json({ message: "Catégories créées/garanties", count, names });
});
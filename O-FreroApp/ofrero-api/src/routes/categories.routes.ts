import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireAdmin } from "../middleware/auth";

export const categoriesRouter = Router();

// Routes to list all categories by name

categoriesRouter.get("/", async (_req, res) =>  {
    const categories = await prisma.category.findMany({
        orderBy: { name: "asc"},
    });
    res.json(categories);
});

// Create a new categories via "post" request

const CategoryCreateSchema = z.object({
  name: z.string().min(2),
});

categoriesRouter.post("/", requireAuth, requireAdmin, async (req, res) => {
  const parsed = CategoryCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Corps invalide", details: parsed.error.flatten() });
  }

  try {
    const cat = await prisma.category.create({ data: parsed.data });
    res.status(201).json(cat);
  } catch (e: any) {
    // name est unique -> conflit si doublon
    return res.status(409).json({ error: "Cette catégorie existe déjà" });
  }
});

// Rename une categorie "update"

const CategoryUpdateSchema = z.object({
  name: z.string().min(2),
});

categoriesRouter.patch("/:id", requireAuth, requireAdmin, async (req, res) => {
  const parsed = CategoryUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Corps invalide", details: parsed.error.flatten() });
  }

  try {
    const cat = await prisma.category.update({
      where: { id: req.params.id },
      data: { name: parsed.data.name },
    });
    res.json(cat);
  } catch (_e) {
    return res.status(404).json({ error: "Catégorie introuvable" });
  }
});

/**
 * DELETE /categories/:id
 * Supprimer une catégorie (admin)
 * on passe categoryId des produits à NULL (SetNull dans le schema)
 */
categoriesRouter.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const cat = await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ deleted: cat });
  } catch (_e) {
    return res.status(404).json({ error: "Catégorie introuvable" });
  }
});

import { Router } from "express";
import { z } from "zod";
import { PRODUCTS, newId } from "../data/store";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();

//  Lister tous les produits
router.get("/", (_req, res) => res.json(PRODUCTS));

// Obtenir un produit par id
router.get("/:id", (req, res) => {
  const p = PRODUCTS.find(p => p.id === req.params.id);
  if (!p) return res.status(404).json({ error: "Not found" });
  res.json(p);
});

// Ajouter un produit comme pizza boisson etc (admin uniquement)
router.post("/", requireAuth, requireAdmin, (req, res) => {
  const schema = z.object({
    name: z.string().min(2),
    priceCents: z.number().int().min(0),
    description: z.string().optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });

  const newProduct = { id: newId(), ...parsed.data };
  PRODUCTS.push(newProduct);

  res.status(201).json(newProduct);
});

export const productsRouter = router;
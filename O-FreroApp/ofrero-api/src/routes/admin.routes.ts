import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { PRODUCTS } from "../data/store";

export const adminRouter = Router();

adminRouter.get("/ping", requireAuth, requireAdmin, (_req, res) => {
  res.json({ ok: true, area: "admin" });
});

// exemple : liste produits visible côté admin (même data pour l’instant)
adminRouter.get("/products", requireAuth, requireAdmin, (_req, res) => {
  res.json(PRODUCTS);
});
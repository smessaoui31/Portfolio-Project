// src/routes/cart.routes.ts
import { Router } from "express";
import { z } from "zod";
import { requireAuth, AuthRequest } from "../middleware/auth";
import {
  getCartWithTotalPrisma,
  addItemToCartPrisma,
  updateCartItemPrisma,
  removeCartItemPrisma,
  // ✅ nouvelles fonctions à implémenter dans cart.prisma.service.ts
  updateCartItemCookingPrisma,
  addSupplementToCartItemPrisma,
  removeSupplementFromCartItemPrisma,
  setCartItemSupplementsPrisma,
} from "../services/cart.prisma.service";

export const cartRouter = Router();

/** GET /cart — récupérer le panier (avec total + suppléments inclus) */
cartRouter.get("/", requireAuth, async (req: AuthRequest, res) => {
  const cart = await getCartWithTotalPrisma(req.user!.id);
  res.json(cart);
});

/** ENUM cuisson partagée */
const CookingEnum = z.enum(["NORMAL", "WELL_DONE", "EXTRA_CRISPY"]);

/** POST /cart/items — ajouter un article (avec cuisson + suppléments) */
const AddSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1).max(99),
  cooking: CookingEnum.default("NORMAL"),
  supplementIds: z.array(z.string().cuid()).optional().default([]),
});

cartRouter.post("/items", requireAuth, async (req: AuthRequest, res) => {
  const parsed = AddSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Invalid body", details: parsed.error.flatten() });
  }

  try {
    const { productId, quantity, cooking, supplementIds } = parsed.data;
    const cart = await addItemToCartPrisma(req.user!.id, productId, quantity, {
      cooking,
      supplementIds,
});

    res.status(201).json(cart);
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (msg.includes("Product not found")) {
      return res.status(404).json({ error: "Product not found" });
    }
    if (msg.includes("Supplement not found")) {
      return res.status(404).json({ error: "Supplement not found" });
    }
    console.error(e);
    res.status(500).json({ error: "Internal error" });
  }
});

/** PATCH /cart/items/:itemId — maj quantité (0 = supprime) */
const UpdateQtySchema = z.object({
  quantity: z.number().int().min(0).max(99),
});

cartRouter.patch("/items/:itemId", requireAuth, async (req: AuthRequest, res) => {
  const parsed = UpdateQtySchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Invalid body", details: parsed.error.flatten() });
  }

  try {
    const cart = await updateCartItemPrisma(
      req.user!.id,
      req.params.itemId,
      parsed.data.quantity
    );
    res.json(cart);
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (msg.includes("Item not found")) {
      return res.status(404).json({ error: "Item not found" });
    }
    console.error(e);
    res.status(500).json({ error: "Internal error" });
  }
});

/** PATCH /cart/items/:itemId/cooking — maj cuisson d’un item */
const UpdateCookingSchema = z.object({
  cooking: CookingEnum,
});

cartRouter.patch(
  "/items/:itemId/cooking",
  requireAuth,
  async (req: AuthRequest, res) => {
    const parsed = UpdateCookingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: "Invalid body", details: parsed.error.flatten() });
    }

    try {
      const cart = await updateCartItemCookingPrisma(
        req.user!.id,
        req.params.itemId,
        parsed.data.cooking
      );
      res.json(cart);
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (msg.includes("Item not found")) {
        return res.status(404).json({ error: "Item not found" });
      }
      console.error(e);
      res.status(500).json({ error: "Internal error" });
    }
  }
);

/** POST /cart/items/:itemId/supplements — ajoute 1 supplément à l’item */
const AddOneSupplementSchema = z.object({
  supplementId: z.string().cuid(),
});
cartRouter.post(
  "/items/:itemId/supplements",
  requireAuth,
  async (req: AuthRequest, res) => {
    const parsed = AddOneSupplementSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: "Invalid body", details: parsed.error.flatten() });
    }
    try {
      const cart = await addSupplementToCartItemPrisma(
        req.user!.id,
        req.params.itemId,
        parsed.data.supplementId
      );
      res.status(201).json(cart);
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (msg.includes("Item not found")) {
        return res.status(404).json({ error: "Item not found" });
      }
      if (msg.includes("Supplement not found")) {
        return res.status(404).json({ error: "Supplement not found" });
      }
      if (msg.includes("Already attached")) {
        return res.status(409).json({ error: "Supplement already attached" });
      }
      console.error(e);
      res.status(500).json({ error: "Internal error" });
    }
  }
);

/** DELETE /cart/items/:itemId/supplements/:supplementId — retire 1 supplément */
cartRouter.delete(
  "/items/:itemId/supplements/:supplementId",
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const cart = await removeSupplementFromCartItemPrisma(
        req.user!.id,
        req.params.itemId,
        req.params.supplementId
      );
      res.json({ removed: req.params.supplementId, cart });
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (msg.includes("Item not found")) {
        return res.status(404).json({ error: "Item not found" });
      }
      if (msg.includes("Supplement not attached")) {
        return res.status(404).json({ error: "Supplement not attached" });
      }
      console.error(e);
      res.status(500).json({ error: "Internal error" });
    }
  }
);

/** PUT /cart/items/:itemId/supplements — remplace la liste des suppléments */
const SetSupplementsSchema = z.object({
  supplementIds: z.array(z.string().cuid()).default([]),
});
cartRouter.put(
  "/items/:itemId/supplements",
  requireAuth,
  async (req: AuthRequest, res) => {
    const parsed = SetSupplementsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: "Invalid body", details: parsed.error.flatten() });
    }
    try {
      const cart = await setCartItemSupplementsPrisma(
        req.user!.id,
        req.params.itemId,
        parsed.data.supplementIds
      );
      res.json(cart);
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (msg.includes("Item not found")) {
        return res.status(404).json({ error: "Item not found" });
      }
      if (msg.includes("Supplement not found")) {
        return res.status(404).json({ error: "Supplement not found" });
      }
      console.error(e);
      res.status(500).json({ error: "Internal error" });
    }
  }
);

/** DELETE /cart/items/:itemId — supprime un article */
cartRouter.delete("/items/:itemId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const cart = await removeCartItemPrisma(req.user!.id, req.params.itemId);
    res.json({ deleted: req.params.itemId, cart });
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (msg.includes("Item not found")) {
      return res.status(404).json({ error: "Item not found" });
    }
    console.error(e);
    res.status(500).json({ error: "Internal error" });
  }
});
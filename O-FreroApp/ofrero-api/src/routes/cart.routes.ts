import { Router } from "express";
import { z } from "zod";
import { requireAuth, AuthRequest } from "../middleware/auth";
import {
  getCartWithTotalPrisma,
  addItemToCartPrisma,
  updateCartItemPrisma,
  removeCartItemPrisma,
} from "../services/cart.prisma.service";

export const cartRouter = Router();

/** GET /cart — récupérer le panier */
cartRouter.get("/", requireAuth, async (req: AuthRequest, res) => {
  const cart = await getCartWithTotalPrisma(req.user!.id);
  res.json(cart);
});

/** POST /cart/items — ajouter un article */
const AddSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1).max(99),
});

cartRouter.post("/items", requireAuth, async (req: AuthRequest, res) => {
  const parsed = AddSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });

  try {
    const cart = await addItemToCartPrisma(req.user!.id, parsed.data.productId, parsed.data.quantity);
    res.status(201).json(cart);
  } catch (e: any) {
    if (String(e.message).includes("Product not found")) return res.status(404).json({ error: "Product not found" });
    console.error(e);
    res.status(500).json({ error: "Internal error" });
  }
});

/** PATCH /cart/items/:itemId — maj quantité (0 = supprime) */
const UpdateSchema = z.object({ quantity: z.number().int().min(0).max(99) });

cartRouter.patch("/items/:itemId", requireAuth, async (req: AuthRequest, res) => {
  const parsed = UpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });

  try {
    const cart = await updateCartItemPrisma(req.user!.id, req.params.itemId, parsed.data.quantity);
    res.json(cart);
  } catch (e: any) {
    if (String(e.message).includes("Item not found")) return res.status(404).json({ error: "Item not found" });
    console.error(e);
    res.status(500).json({ error: "Internal error" });
  }
});

/** DELETE /cart/items/:itemId — supprime un article */
cartRouter.delete("/items/:itemId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const cart = await removeCartItemPrisma(req.user!.id, req.params.itemId);
    res.json({ deleted: req.params.itemId, cart });
  } catch (e: any) {
    if (String(e.message).includes("Item not found")) return res.status(404).json({ error: "Item not found" });
    console.error(e);
    res.status(500).json({ error: "Internal error" });
  }
});
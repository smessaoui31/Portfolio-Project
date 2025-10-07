import { Router } from "express";
import { z } from "zod";
import { requireAuth, AuthRequest } from "../middleware/auth";
import {
  PRODUCTS,
  getOrCreateCart,
  cartTotalCents,
  newItemId,
} from "../data/store";

export const cartRouter = Router();

// ---- GET /cart ----
cartRouter.get("/", requireAuth, (req: AuthRequest, res) => {
  const cart = getOrCreateCart(req.user!.id);
  res.json({ id: `cart_${cart.userId}`, items: cart.items, totalCents: cartTotalCents(cart) });
});

// ---- POST /cart/items ----
const AddItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive().max(99)
});

cartRouter.post("/items", requireAuth, (req: AuthRequest, res) => {
  const parsed = AddItemSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
  }
  const { productId, quantity } = parsed.data;

  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return res.status(404).json({ error: "Product not found" });

  const cart = getOrCreateCart(req.user!.id);

  // si l'item existe déjà (même productId), on incrémente
  const existing = cart.items.find(i => i.productId === productId);
  if (existing) {
    existing.quantity = Math.min(existing.quantity + quantity, 99);
  } else {
    cart.items.push({
      id: newItemId(),
      productId,
      name: product.name,
      unitPriceCents: product.priceCents,
      quantity
    });
  }

  res.status(201).json({ id: `cart_${cart.userId}`, items: cart.items, totalCents: cartTotalCents(cart) });
});

// ---- PATCH /cart/items/:itemId ----
const UpdateItemSchema = z.object({
  quantity: z.number().int().min(0).max(99) // 0 => supprime l'item
});

cartRouter.patch("/items/:itemId", requireAuth, (req: AuthRequest, res) => {
  const parsed = UpdateItemSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
  }
  const { itemId } = req.params;
  const { quantity } = parsed.data;

  const cart = getOrCreateCart(req.user!.id);
  const idx = cart.items.findIndex(i => i.id === itemId);
  if (idx === -1) return res.status(404).json({ error: "Item not found" });

  if (quantity === 0) {
    cart.items.splice(idx, 1);
  } else {
    cart.items[idx].quantity = quantity;
  }

  res.json({ id: `cart_${cart.userId}`, items: cart.items, totalCents: cartTotalCents(cart) });
});

// ---- DELETE /cart/items/:itemId ----
cartRouter.delete("/items/:itemId", requireAuth, (req: AuthRequest, res) => {
  const cart = getOrCreateCart(req.user!.id);
  const idx = cart.items.findIndex(i => i.id === req.params.itemId);
  if (idx === -1) return res.status(404).json({ error: "Item not found" });

  const [deleted] = cart.items.splice(idx, 1);
  res.json({
    deleted,
    cart: { id: `cart_${cart.userId}`, items: cart.items, totalCents: cartTotalCents(cart) }
  });
});
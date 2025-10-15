// src/routes/checkout.routes.ts
import express, { Router } from "express";
import Stripe from "stripe";
import { z } from "zod";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { stripe } from "../lib/stripe";         
import { prisma } from "../lib/prisma";
import {
  createOrderFromCartPrisma,
  findOrderByPaymentIntentPrisma,
  setOrderStatusPrisma,
  upsertPaymentPrisma,
} from "../services/checkout.prisma.service";

import { getOrCreateCart } from "../data/store";

export const checkoutRouter = Router();

/** ---------- 1) Start checkout : Order + PaymentIntent (100% Prisma côté Order) ---------- */
const CheckoutSchema = z.object({
  addressLine: z.string().min(3),
  city: z.string().min(2),
  postalCode: z.string().min(3),
  phone: z.string().min(10)
});

checkoutRouter.post("/start", requireAuth, async (req: AuthRequest, res) => {
  const parsed = CheckoutSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
  }

  // 1) Récupérer le panier (in-memory pour l’instant)
  const cart = getOrCreateCart(req.user!.id);
  if (cart.items.length === 0) return res.status(400).json({ error: "Cart is empty" });

  // Transformer le cart vers [{ productId, quantity }]
  const cartItems = cart.items.map(ci => ({ productId: ci.productId, quantity: ci.quantity }));

  // 2) Créer Order + Items en DB (Prisma) et calculer total côté serveur
  const { order, totalCents } = await createOrderFromCartPrisma({
    userId: req.user!.id,
    cartItems,
    ...parsed.data,
  });

  // 3) Créer PaymentIntent Stripe (montant = totalCents)
  const paymentIntent = await stripe.paymentIntents.create(
    {
      amount: totalCents,
      currency: "eur",
      metadata: { order_id: order.id, user_id: req.user!.id },
      automatic_payment_methods: { enabled: true },
    },
    { idempotencyKey: `order_${order.id}` } // anti double-clic
  );

  // 4) Lier l’intent à l’Order en DB
  await prisma.order.update({
    where: { id: order.id },
    data: { stripePaymentIntentId: paymentIntent.id },
  });

  return res.status(200).json({
    orderId: order.id,
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  });
});

/** ---------- 2) Webhook : handler séparé (RAW body obligatoire côté app.ts) ---------- */
export async function checkoutWebhookHandler(req: express.Request, res: express.Response) {
  const sig = req.headers["stripe-signature"] as string | undefined;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (sig && webhookSecret) {
      // ✅ vérification de signature (prod / Stripe CLI)
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      // 🧪 DEV: accepte un JSON brut (NE PAS FAIRE EN PROD)
      const raw = req.body as any;
      const parsed = Buffer.isBuffer(raw) ? JSON.parse(raw.toString("utf8")) : raw;
      event = parsed as Stripe.Event;
    }
  } catch (err: any) {
    console.error("Webhook parse/signature failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;
      const order = await findOrderByPaymentIntentPrisma(pi.id);
      if (order) {
        await setOrderStatusPrisma(order.id, "PAID");
        await upsertPaymentPrisma({
          orderId: order.id,
          provider: "stripe",
          status: "succeeded",
          intentId: pi.id,
        });
      }
      break;
    }
    case "payment_intent.payment_failed": {
      const pi = event.data.object as Stripe.PaymentIntent;
      const order = await findOrderByPaymentIntentPrisma(pi.id);
      if (order) {
        await setOrderStatusPrisma(order.id, "FAILED");
        await upsertPaymentPrisma({
          orderId: order.id,
          provider: "stripe",
          status: "failed",
          intentId: pi.id,
        });
      }
      break;
    }
    default:
      // autres events (refund, dispute...) à traiter plus tard
      break;
  }

  return res.json({ ok: true, event: event.type });
}

/** ---------- 3) Consulter une commande (depuis la DB) ---------- */
checkoutRouter.get("/orders/:id", requireAuth, async (req: AuthRequest, res) => {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
    include: { items: true, payment: true },
  });
  if (!order) return res.status(404).json({ error: "Order not found" });
  return res.json(order);
});
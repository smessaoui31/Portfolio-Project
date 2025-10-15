import express, { Router } from "express";
import Stripe from "stripe";
import { z } from "zod";
import { requireAuth, AuthRequest } from "../middleware/auth";
import {
  getOrCreateCart,
  cartTotalCents,
  ORDERS,
  createOrderFromCart,
  findOrderByPaymentIntent,
  setOrderStatus
} from "../data/store";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY in .env");
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-09-30.clover",
});

export const checkoutRouter = Router();

/** ---------- 1) Start checkout : Order + PaymentIntent ---------- */
const CheckoutSchema = z.object({
  addressLine: z.string().min(3),
  city: z.string().min(2),
  postalCode: z.string().min(3),
  phone: z.string().min(6),
});

checkoutRouter.post("/start", requireAuth, async (req: AuthRequest, res) => {
  const parsed = CheckoutSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
  }

  const cart = getOrCreateCart(req.user!.id);
  if (cart.items.length === 0) return res.status(400).json({ error: "Cart is empty" });

  const totalCents = cartTotalCents(cart);
  const order = createOrderFromCart(req.user!.id, cart.items, totalCents);

  // Astuce anti-doublons : idempotencyKey basée sur l’order
  const paymentIntent = await stripe.paymentIntents.create(
    {
      amount: totalCents,
      currency: "eur",
      metadata: { order_id: order.id, user_id: req.user!.id },
      automatic_payment_methods: { enabled: true },
    },
    { idempotencyKey: `order_${order.id}` }
  );

  order.stripePaymentIntentId = paymentIntent.id;

  return res.status(200).json({
    orderId: order.id,
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id, // utile pour tests Postman
  });
});

/** ---------- 2) Webhook : handler séparé (RAW body) ---------- */
export async function checkoutWebhookHandler(req: express.Request, res: express.Response) {
  const sig = req.headers["stripe-signature"] as string | undefined;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event: Stripe.Event;

  try {
    if (sig && webhookSecret) {
      // Vérification de signature (prod/CLI Stripe)
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      // DEV: accepter JSON manuel depuis Postman
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
      const order = findOrderByPaymentIntent(pi.id);
      if (order) setOrderStatus(order.id, "paid");
      break;
    }
    case "payment_intent.payment_failed": {
      const pi = event.data.object as Stripe.PaymentIntent;
      const order = findOrderByPaymentIntent(pi.id);
      if (order) setOrderStatus(order.id, "failed");
      break;
    }
    default:
      // autres events au besoin
      break;
  }

  return res.json({ ok: true, event: event.type });
}

/** ---------- 3) Consulter une commande ---------- */
checkoutRouter.get("/orders/:id", requireAuth, (req: AuthRequest, res) => {
  const order = ORDERS.find((o) => o.id === req.params.id && o.userId === req.user!.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  return res.json(order);
});
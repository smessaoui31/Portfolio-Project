import express, { Router, Request, Response } from "express";
import Stripe from "stripe";
import { z } from "zod";
import type { CartView, CartItemView } from "../services/cart.prisma.service";

import { requireAuth, AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { stripe } from "../lib/stripe";

import {
  createOrderFromCartPrisma,
  findOrderByPaymentIntentPrisma,
  setOrderStatusPrisma,
  upsertPaymentPrisma,
} from "../services/checkout.prisma.service";

import {
  getCartWithTotalPrisma,
  clearCartPrisma,
} from "../services/cart.prisma.service";

export const checkoutRouter = Router();
/* --------------------------------------------------------------------------*/
/*                               1) START CHECKOUT                            */

const CheckoutSchema = z.object({
  addressLine: z.string().min(3),
  city: z.string().min(2),
  postalCode: z.string().min(3),
  phone: z.string().min(10), 
});

checkoutRouter.post("/start", requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = CheckoutSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
  }

  // 1) Récupère le panier de l'utilisateur (en DB)
const cart: CartView = await getCartWithTotalPrisma(req.user!.id);

const cartItems = cart.items.map((item: CartItemView) => ({
  productId: item.productId,
  quantity: item.quantity,
}));

  // 3) Crée l’Order + Items (transaction) et calcule total côté serveur
  const { order, totalCents } = await createOrderFromCartPrisma({
    userId: req.user!.id,
    cartItems,
    ...parsed.data,
  });

  // 4) Crée un PaymentIntent Stripe
  const paymentIntent = await stripe.paymentIntents.create(
    {
      amount: totalCents,
      currency: "eur",
      metadata: {
        order_id: order.id,
        user_id: req.user!.id,
      },
      automatic_payment_methods: { enabled: true },
    },
    { idempotencyKey: `order_${order.id}` } // anti double-clic
  );

  // 5) Lie la PI à l’Order
  await prisma.order.update({
    where: { id: order.id },
    data: { stripePaymentIntentId: paymentIntent.id },
  });

  // 6) Vide le panier (en DB)
  await clearCartPrisma(req.user!.id);

  return res.status(200).json({
    orderId: order.id,
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  });
});
/* ---------------------------------------------------------------------------*/
/*                            2) WEBHOOK STRIPE (RAW)                         */

export async function checkoutWebhookHandler(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"] as string | undefined;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (sig && webhookSecret) {
      // Vérification de signature (Stripe CLI / Prod)
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {

      const raw = req.body as any;
      const parsed = Buffer.isBuffer(raw) ? JSON.parse(raw.toString("utf8")) : raw;
      event = parsed as Stripe.Event;
    }
  } catch (err: any) {
    console.error("Webhook verification failed:", err?.message || err);
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
      // autres events (refunds, disputes, etc.) si besoin
      break;
  }

  return res.json({ ok: true, event: event.type });
}

/* -------------------------------------------------------------------------- */
/*                        3) CONSULTER UNE COMMANDE                           */

checkoutRouter.get("/orders/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
    include: { items: true, payment: true },
  });
  if (!order) return res.status(404).json({ error: "Order not found" });
  return res.json(order);
});
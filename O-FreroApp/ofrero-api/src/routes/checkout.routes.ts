// src/routes/checkout.routes.ts
import express, { Router, Request, Response } from "express";
import Stripe from "stripe";
import { z } from "zod";
import type { CartView } from "../services/cart.prisma.service";

import { requireAuth, AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { stripe } from "../lib/stripe";

import {
  createOrderFromCartPrisma,
  createGuestOrderPrisma,
  findOrderByPaymentIntentPrisma,
  setOrderStatusPrisma,
  upsertPaymentPrisma,
} from "../services/checkout.prisma.service";

import {
  getCartWithTotalPrisma,
  clearCartPrisma,
} from "../services/cart.prisma.service";

export const checkoutRouter = Router();

/* --------------------------- 1) START CHECKOUT --------------------------- */

// Deux variantes possibles : soit addressId, soit bloc d’adresse
const AddressBlock = z.object({
  line1: z.string().min(3),
  line2: z.string().optional(),
  city: z.string().min(2),
  postalCode: z.string().min(3),
  phone: z.string().min(6),
});

const CheckoutSchema = z.object({
  addressId: z.string().cuid().optional(),
  address: AddressBlock.optional(),
});

checkoutRouter.post("/start", requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = CheckoutSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
  }

  // 1) Récupère le panier de l'utilisateur (en DB)
  const cart: CartView = await getCartWithTotalPrisma(req.user!.id);
  if (cart.items.length === 0) return res.status(400).json({ error: "Cart is empty" });

  // 2) Résoudre l’adresse à utiliser (priorité : addressId > défaut > body.address)
  let addressSnapshot:
    | { line1: string; line2?: string | null; city: string; postalCode: string; phone: string }
    | null = null;

  if (parsed.data.addressId) {
    // adresse explicite
    const addr = await prisma.address.findFirst({
      where: { id: parsed.data.addressId, userId: req.user!.id },
    });
    if (!addr) return res.status(404).json({ error: "Address not found" });
    addressSnapshot = {
      line1: addr.line1,
      line2: addr.line2 ?? null,
      city: addr.city,
      postalCode: addr.postalCode,
      phone: addr.phone,
    };
  } else {
    // tenter l’adresse par défaut
    const def = await prisma.address.findFirst({
      where: { userId: req.user!.id, isDefault: true },
    });
    if (def) {
      addressSnapshot = {
        line1: def.line1,
        line2: def.line2 ?? null,
        city: def.city,
        postalCode: def.postalCode,
        phone: def.phone,
      };
    } else if (parsed.data.address) {
      // fallback : bloc d’adresse direct dans le body
      const a = parsed.data.address;
      addressSnapshot = {
        line1: a.line1,
        line2: a.line2 ?? null,
        city: a.city,
        postalCode: a.postalCode,
        phone: a.phone,
      };
    } else {
      return res.status(400).json({
        error: "No address available",
        hint: "Provide addressId, or set a default address, or pass { address: {...} }",
      });
    }
  }

  // 3) Crée l'Order + Items (transaction) et calcule total côté serveur
  //    createOrderFromCartPrisma lit directement le panier depuis la DB et génère un orderNumber unique
  const { order, totalCents } = await createOrderFromCartPrisma({
    userId: req.user!.id,
    address: addressSnapshot,
  });

  // 5) Crée un PaymentIntent Stripe
  const paymentIntent = await stripe.paymentIntents.create(
    {
      amount: totalCents,
      currency: "eur",
      metadata: {
        order_id: order.id,
        user_id: req.user!.id,
        order_number: order.orderNumber ?? "", // utile dans le dashboard Stripe
      },
      automatic_payment_methods: { enabled: true },
    },
    { idempotencyKey: `order_${order.id}` }
  );

  // 6) Lie la PI à l’Order
  await prisma.order.update({
    where: { id: order.id },
    data: { stripePaymentIntentId: paymentIntent.id },
  });

  // 7) Vide le panier
  await clearCartPrisma(req.user!.id);

  return res.status(200).json({
    orderId: order.id,
    orderNumber: order.orderNumber, // 👈 renvoyé au front
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  });
});

/* ----------------------- 1b) GUEST CHECKOUT --------------------------- */

const GuestItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().min(1),
  cooking: z.string().optional(),
  supplements: z.array(z.string().cuid()).optional(),
});

const GuestInfoSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(6),
  address: z.string().min(5),
});

const GuestCheckoutSchema = z.object({
  items: z.array(GuestItemSchema).min(1),
  guestInfo: GuestInfoSchema,
});

checkoutRouter.post("/guest", async (req: Request, res: Response) => {
  const parsed = GuestCheckoutSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
  }

  const { items, guestInfo } = parsed.data;

  try {
    // 1) Créer la commande invité
    const { order, totalCents } = await createGuestOrderPrisma({
      items,
      guestInfo,
    });

    // 2) Créer un PaymentIntent Stripe
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: totalCents,
        currency: "eur",
        metadata: {
          order_id: order.id,
          order_number: order.orderNumber ?? "",
          guest_email: guestInfo.email,
          guest_name: `${guestInfo.firstName} ${guestInfo.lastName}`,
        },
        receipt_email: guestInfo.email,
        automatic_payment_methods: { enabled: true },
      },
      { idempotencyKey: `order_${order.id}` }
    );

    // 3) Lier le PaymentIntent à la commande
    await prisma.order.update({
      where: { id: order.id },
      data: { stripePaymentIntentId: paymentIntent.id },
    });

    return res.status(200).json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err: any) {
    console.error("[checkout/guest] Error:", err);
    return res.status(500).json({ error: err?.message || "Internal server error" });
  }
});

/* ------------------------ 2) WEBHOOK STRIPE (RAW) ------------------------ */

export async function checkoutWebhookHandler(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"] as string | undefined;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (sig && webhookSecret) {
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
      break;
  }

  return res.json({ ok: true, event: event.type });
}

/* -------------------------- 3) GET /orders/:id --------------------------- */
/** Lecture par ID (toujours utile pour nos liens internes) */
checkoutRouter.get("/orders/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
    include: { items: true, payment: true },
  });
  if (!order) return res.status(404).json({ error: "Order not found" });
  return res.json(order);
});

/* ------------- 4) GET /orders/by-number/:orderNumber (nouveau) ---------- */
/** Lecture par numéro lisible — pratique pour pages de succès / support */
checkoutRouter.get(
  "/orders/by-number/:orderNumber",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    const order = await prisma.order.findFirst({
      where: { orderNumber: req.params.orderNumber, userId: req.user!.id },
      include: { items: true, payment: true },
    });
    if (!order) return res.status(404).json({ error: "Order not found" });
    return res.json(order);
  }
);
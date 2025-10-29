// src/routes/admin.orders.routes.ts
import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireAdmin, AuthRequest } from "../middleware/auth";
import type { Prisma, OrderStatus } from "@prisma/client";

export const adminOrdersRouter = Router();

/**
 * GET /admin/orders
 * Liste paginée de TOUTES les commandes (admin-only)
 * Query optionnelles:
 *  - page, pageSize
 *  - status (PENDING|PAID|FAILED|CANCELLED)
 *  - q (recherche simple sur orderNumber ou email)
 */
adminOrdersRouter.get(
  "/orders",
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const page = Math.max(parseInt(String(req.query.page ?? "1"), 10) || 1, 1);
      const pageSize = Math.min(
        Math.max(parseInt(String(req.query.pageSize ?? "20"), 10) || 20, 1),
        100
      );
      const skip = (page - 1) * pageSize;

      const raw = (req.query.status as string | undefined)?.toUpperCase();
      const allowed: OrderStatus[] = ["PENDING", "PAID", "FAILED", "CANCELLED"];
      const status: OrderStatus | undefined =
        raw && (allowed as readonly string[]).includes(raw) ? (raw as OrderStatus) : undefined;

      const q = (req.query.q as string | undefined)?.trim();

      // Filtre de base
      const whereBase: Prisma.OrderWhereInput = status ? { status } : {};

      // Recherche optionnelle par orderNumber ou email utilisateur
      const where: Prisma.OrderWhereInput = q
        ? {
            AND: [
              whereBase,
              {
                OR: [
                  { orderNumber: { contains: q, mode: "insensitive" } },
                  { user: { email: { contains: q, mode: "insensitive" } } },
                ],
              },
            ],
          }
        : whereBase;

      const [items, total] = await Promise.all([
        prisma.order.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: pageSize,
          include: {
            user: { select: { id: true, email: true, fullName: true } },
            items: { select: { id: true, name: true, quantity: true, unitPriceCents: true } },
            payment: { select: { status: true, provider: true, intentId: true } },
          },
        }),
        prisma.order.count({ where }),
      ]);

      res.json({
        page,
        pageSize,
        total,
        items: items.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          createdAt: o.createdAt,
          status: o.status,
          totalCents: o.totalCents,
          user: o.user
            ? { id: o.user.id, email: o.user.email, fullName: o.user.fullName }
            : null,
          items: o.items,
          payment: o.payment ?? null,
        })),
      });
    } catch (err: any) {
      console.error("[admin/orders] error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

/**
 * GET /admin/orders/:id
 * Détail d’une commande (admin-only)
 */
adminOrdersRouter.get(
  "/orders/:id",
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const id = req.params.id;

      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, email: true, fullName: true } },
          items: {
            select: {
              id: true,
              productId: true,
              name: true,
              quantity: true,
              unitPriceCents: true,
            },
            orderBy: { id: "asc" },
          },
          payment: { select: { status: true, provider: true, intentId: true, createdAt: true } },
        },
      });

      if (!order) return res.status(404).json({ error: "Order not found" });

      res.json({
        id: order.id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        status: order.status,
        totalCents: order.totalCents,
        user: order.user
          ? { id: order.user.id, email: order.user.email, fullName: order.user.fullName }
          : null,
        items: order.items,
        payment: order.payment ?? null,
        shipping: {
          line1: order.shippingLine1,
          line2: order.shippingLine2,
          city: order.shippingCity,
          postalCode: order.shippingPostalCode,
          phone: order.shippingPhone,
        },
        stripePaymentIntentId: order.stripePaymentIntentId ?? null,
      });
    } catch (err: any) {
      console.error("[admin/orders/:id] error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

/**
 * GET /admin/orders/by-number/:orderNumber
 * Détail d’une commande via son numéro lisible (admin-only)
 */
adminOrdersRouter.get(
  "/orders/by-number/:orderNumber",
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const on = req.params.orderNumber;

      const order = await prisma.order.findFirst({
        where: { orderNumber: on },
        include: {
          user: { select: { id: true, email: true, fullName: true } },
          items: {
            select: {
              id: true,
              productId: true,
              name: true,
              quantity: true,
              unitPriceCents: true,
            },
            orderBy: { id: "asc" },
          },
          payment: { select: { status: true, provider: true, intentId: true, createdAt: true } },
        },
      });

      if (!order) return res.status(404).json({ error: "Order not found" });

      res.json({
        id: order.id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        status: order.status,
        totalCents: order.totalCents,
        user: order.user
          ? { id: order.user.id, email: order.user.email, fullName: order.user.fullName }
          : null,
        items: order.items,
        payment: order.payment ?? null,
        shipping: {
          line1: order.shippingLine1,
          line2: order.shippingLine2,
          city: order.shippingCity,
          postalCode: order.shippingPostalCode,
          phone: order.shippingPhone,
        },
        stripePaymentIntentId: order.stripePaymentIntentId ?? null,
      });
    } catch (err: any) {
      console.error("[admin/orders/by-number/:orderNumber] error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);
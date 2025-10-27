// src/routes/admin.orders.routes.ts
import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireAdmin, AuthRequest } from "../middleware/auth";
import type { Prisma, OrderStatus } from "@prisma/client";

export const adminOrdersRouter = Router();

/**
 * GET /admin/orders
 * Liste paginée de TOUTES les commandes (admin-only)
 * Query optionnelles: page, pageSize, status (PENDING|PAID|FAILED|CANCELLED)
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

      // status optionnel, validé contre l’enum Prisma
      const raw = (req.query.status as string | undefined)?.toUpperCase();
      const allowed: OrderStatus[] = ["PENDING", "PAID", "FAILED", "CANCELLED"];
      const status: OrderStatus | undefined =
        raw && (allowed as readonly string[]).includes(raw) ? (raw as OrderStatus) : undefined;

      // ✅ where typé correctement
      const where: Prisma.OrderWhereInput = status ? { status } : {};

      const [items, total] = await Promise.all([
        prisma.order.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: pageSize,
          include: {
            // ✅ ta relation s’appelle "user" dans le schema
            user: { select: { id: true, email: true, fullName: true } },
            items: {
              select: { id: true, name: true, quantity: true, unitPriceCents: true },
            },
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
          createdAt: o.createdAt,
          status: o.status,
          totalCents: o.totalCents,
          user: o.user
            ? {
                id: o.user.id,
                email: o.user.email,
                fullName: o.user.fullName,
              }
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
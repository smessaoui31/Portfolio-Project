import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireAdmin, AuthRequest } from "../middleware/auth";

export const ordersRouter = Router();

// Listing des commandes de l'user connecté

ordersRouter.get("/", requireAuth, async (req: AuthRequest, res) => {
    const orders = await prisma.order.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: "desc" },
        include: {
            items: {
                select: {
                    id: true,
                    productId: true,
                    name: true,
                    unitPriceCents: true,
                    quantity: true,
                },
            },
            payment: true,
        },
    });
    res.json(orders);
});


// Détail d'une commande de l'utilisateur connecté via son id 
ordersRouter.get("/:id", requireAuth, async (req: AuthRequest, res) => {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
    include: {
      items: {
        select: {
          id: true,
          productId: true,
          name: true,
          unitPriceCents: true,
          quantity: true,
        },
      },
      payment: true,
    },
  });
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(order);
});

/**
 * GET /orders/admin
 * Liste de TOUTES les commandes (admin)
 */
ordersRouter.get("/admin", requireAuth, requireAdmin, async (_req, res) => {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, email: true, fullName: true } },
      items: {
        select: {
          id: true,
          productId: true,
          name: true,
          unitPriceCents: true,
          quantity: true,
        },
      },
      payment: true,
    },
  });
  res.json(orders);
});
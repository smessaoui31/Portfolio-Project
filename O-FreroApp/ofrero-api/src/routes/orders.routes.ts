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
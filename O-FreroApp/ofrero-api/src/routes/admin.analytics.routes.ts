import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireAdmin, AuthRequest } from "../middleware/auth";

export const adminAnalyticsRouter = Router();

/* ---------- GET /admin/analytics/dashboard ---------- */
adminAnalyticsRouter.get(
  "/analytics/dashboard",
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const { period } = req.query as { period?: string };

      // Calculate date range based on period
      let startDate = new Date();
      switch (period) {
        case "today":
          startDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case "year":
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate = new Date(0); // All time
      }

      // Get orders in the period
      const orders = await prisma.order.findMany({
        where: {
          createdAt: { gte: startDate },
        },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true, priceCents: true },
              },
            },
          },
        },
      });

      const paidOrders = orders.filter((o) => o.status === "PAID");
      const pendingOrders = orders.filter((o) => o.status === "PENDING");
      const shippedOrders = orders.filter((o) => o.status === "SHIPPED");
      const deliveredOrders = orders.filter((o) => o.status === "DELIVERED");

      const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalCents, 0);
      const avgBasket = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

      // Top products
      const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
      paidOrders.forEach((order) => {
        order.items.forEach((item) => {
          if (!productSales[item.productId]) {
            productSales[item.productId] = {
              name: item.name,
              quantity: 0,
              revenue: 0,
            };
          }
          productSales[item.productId].quantity += item.quantity;
          productSales[item.productId].revenue += item.unitPriceCents * item.quantity;
        });
      });

      const topProducts = Object.entries(productSales)
        .map(([id, data]) => ({ productId: id, ...data }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);

      // Revenue over time (grouped by day for the period)
      const revenueByDay: Record<string, number> = {};
      paidOrders.forEach((order) => {
        const day = order.createdAt.toISOString().split("T")[0];
        revenueByDay[day] = (revenueByDay[day] || 0) + order.totalCents;
      });

      const revenueTimeline = Object.entries(revenueByDay)
        .map(([date, revenue]) => ({ date, revenue }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Orders over time
      const ordersByDay: Record<string, number> = {};
      orders.forEach((order) => {
        const day = order.createdAt.toISOString().split("T")[0];
        ordersByDay[day] = (ordersByDay[day] || 0) + 1;
      });

      const ordersTimeline = Object.entries(ordersByDay)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      res.json({
        period: period || "all",
        stats: {
          totalOrders: orders.length,
          paidOrders: paidOrders.length,
          pendingOrders: pendingOrders.length,
          shippedOrders: shippedOrders.length,
          deliveredOrders: deliveredOrders.length,
          revenue: totalRevenue,
          avgBasket,
        },
        topProducts,
        revenueTimeline,
        ordersTimeline,
      });
    } catch (err: any) {
      console.error("[admin/analytics/dashboard] error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

/* ---------- GET /admin/search ---------- */
adminAnalyticsRouter.get(
  "/search",
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const q = (req.query.q as string | undefined)?.trim();

      if (!q || q.length < 2) {
        return res.json({ products: [], orders: [], users: [], categories: [] });
      }

      const [products, orders, users, categories] = await Promise.all([
        prisma.product.findMany({
          where: {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          },
          take: 5,
          include: { category: { select: { name: true } } },
        }),
        prisma.order.findMany({
          where: {
            OR: [
              { orderNumber: { contains: q, mode: "insensitive" } },
              { user: { email: { contains: q, mode: "insensitive" } } },
              { user: { fullName: { contains: q, mode: "insensitive" } } },
            ],
          },
          take: 5,
          include: { user: { select: { fullName: true, email: true } } },
        }),
        prisma.user.findMany({
          where: {
            OR: [
              { email: { contains: q, mode: "insensitive" } },
              { fullName: { contains: q, mode: "insensitive" } },
            ],
          },
          take: 5,
          select: { id: true, email: true, fullName: true, role: true },
        }),
        prisma.category.findMany({
          where: {
            name: { contains: q, mode: "insensitive" },
          },
          take: 5,
        }),
      ]);

      res.json({ products, orders, users, categories });
    } catch (err: any) {
      console.error("[admin/search] error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// src/routes/admin.users.routes.ts
import { Router } from "express";
import { z } from "zod";
import type { Prisma, Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAuth, requireAdmin, AuthRequest } from "../middleware/auth";

export const adminUsersRouter = Router();

/* ------------------------ helpers pagination & tri ------------------------ */
function parsePagination(query: any) {
  const page = Math.max(parseInt(String(query.page ?? "1"), 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(String(query.pageSize ?? "20"), 10) || 20, 1), 100);
  const skip = (page - 1) * pageSize;
  const take = pageSize;
  return { page, pageSize, skip, take };
}
function parseSort(query: any): Prisma.UserOrderByWithRelationInput {
  const s = String(query.sort ?? "").toLowerCase();
  if (s.startsWith("email")) return { email: s.endsWith("desc") ? "desc" : "asc" };
  if (s.startsWith("name")) return { fullName: s.endsWith("desc") ? "desc" : "asc" };
  if (s.startsWith("createdat")) return { createdAt: s.endsWith("desc") ? "desc" : "asc" };
  return { createdAt: "desc" };
}

/* ------------------------------ GET /users ------------------------------- */
/**
 * GET /admin/users
 * Query: q (search name/email), role (USER|ADMIN), page, pageSize, sort
 */
adminUsersRouter.get(
  "/users",
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res) => {
    const { page, pageSize, skip, take } = parsePagination(req.query);
    const orderBy = parseSort(req.query);

    const q = (req.query.q as string | undefined)?.trim();
    const roleParam = (req.query.role as string | undefined)?.toUpperCase();

    const where: Prisma.UserWhereInput = {
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" } },
              { fullName: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(roleParam === "USER" || roleParam === "ADMIN" ? { role: roleParam as Role } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip,
        take,
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      page,
      pageSize,
      total,
      items: items.map(u => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        createdAt: u.createdAt,
        ordersCount: u._count.orders,
      })),
    });
  }
);

/* ---------------------------- GET /users/:id ----------------------------- */
adminUsersRouter.get(
  "/users/:id",
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
        addresses: {
          select: {
            id: true,
            line1: true,
            line2: true,
            city: true,
            postalCode: true,
            phone: true,
            isDefault: true,
          },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { orders: true } },
      },
    });
    if (!user) return res.status(404).json({ error: "Not found" });

    res.json({
      ...user,
      ordersCount: user._count.orders,
    });
  }
);

/* ------------------------- PATCH /users/:id/role ------------------------- */
const RoleSchema = z.object({
  role: z.enum(["USER", "ADMIN"]),
});

adminUsersRouter.patch(
  "/users/:id/role",
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res) => {
    const parsed = RoleSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

    // éviter de te retirer l'accès à toi-même par accident
    if (req.user!.id === req.params.id && parsed.data.role !== "ADMIN") {
      return res.status(400).json({ error: "You cannot downgrade your own role." });
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { role: parsed.data.role },
      select: { id: true, email: true, fullName: true, role: true, createdAt: true },
    });
    res.json(updated);
  }
);

/* ------------------------------ DELETE /user ----------------------------- */
adminUsersRouter.delete(
  "/users/:id",
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res) => {
    if (req.user!.id === req.params.id) {
      return res.status(400).json({ error: "You cannot delete your own account." });
    }
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  }
);
import { Router } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";

export const meRouter = Router();

/**
 * GET /me
 * Retourne le profil de l'utilisateur connecté (depuis la DB)
 */
meRouter.get("/", requireAuth, async (req: AuthRequest, res) => {
  const me = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!me) return res.status(401).json({ error: "Unauthorized" });
  res.json(me);
});
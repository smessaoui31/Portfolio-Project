import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET as string;

export type AuthUser = { id: string; email: string; role: "USER" | "ADMIN" };
export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });

  try {
    const token = h.slice("Bearer ".length);
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; email: string; role?: string };
    req.user = { id: payload.sub, email: payload.email, role: (payload.role as any) ?? "USER" };
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });



  // option 2 (plus sûr): recharger depuis la DB pour eviter les pertes de données ! 
  const u = await prisma.user.findUnique({ where: { id: req.user.id }, select: { role: true } });
  if (!u) return res.status(401).json({ error: "Unauthorized" });
  if (u.role !== "ADMIN") return res.status(403).json({ error: "Admins only" });

  next();
}
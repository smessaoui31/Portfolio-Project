import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { USERS } from "../data/store";

const JWT_SECRET = process.env.JWT_SECRET!;

export interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }
  try {
    const token = header.split(" ")[1];
    const payload = jwt.verify(token, JWT_SECRET) as any;
    req.user = { id: payload.sub as string, email: payload.email as string };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const me = USERS.find(u => u.id === req.user!.id);
  if (!me) return res.status(401).json({ error: "Unauthorized" });
  if (me.role !== "admin") return res.status(403).json({ error: "Forbidden: admins only" });
  next();
}
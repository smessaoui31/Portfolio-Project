import { Router } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { USERS } from "../data/store";

export const meRouter = Router();

meRouter.get("/", requireAuth, (req: AuthRequest, res) => {
  const user = USERS.find(u => u.id === req.user!.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ id: user.id, email: user.email, fullName: user.fullName, role: user.role });
});
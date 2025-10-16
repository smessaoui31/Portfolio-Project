import { Router } from "express";
import { registerUserPrisma, loginUserPrisma } from "../services/auth.prisma.service";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const result = await registerUserPrisma(req.body);
  res.status(result.status).json(result.body);
});

authRouter.post("/login", async (req, res) => {
  const result = await loginUserPrisma(req.body);
  res.status(result.status).json(result.body);
});
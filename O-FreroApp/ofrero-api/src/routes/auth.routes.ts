import { Router } from "express";
import { loginUser, registerUser } from "../services/auth.service";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const { status, body } = await registerUser(req.body);
  res.status(status).json(body);
});

authRouter.post("/login", async (req, res) => {
  const { status, body } = await loginUser(req.body);
  res.status(status).json(body);
});
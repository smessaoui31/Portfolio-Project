import { Router } from "express";
import { registerUser } from "../services/auth.service";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const { status, body } = await registerUser(req.body);
  res.status(status).json(body);
});

authRouter.post("/login", async (req, res) => {
  // TODO: Implement login functionality or import loginUser if it exists
  res.status(501).json({ error: "Login functionality not implemented." });
});
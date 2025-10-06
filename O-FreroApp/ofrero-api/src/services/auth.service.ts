import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { USERS, User, newId } from "../data/store";

const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) throw new Error("Missing JWT_SECRET in .env");

export const AuthSchemas = {
  register: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    fullName: z.string().min(2)
  }),
  login: z.object({
    email: z.string().email(),
    password: z.string().min(6)
  })
};

export async function registerUser(data: unknown) {
  const parsed = AuthSchemas.register.safeParse(data);
  if (!parsed.success) return { status: 400, body: { error: "Invalid body", details: parsed.error.flatten() } };

  const { email, password, fullName } = parsed.data;

  const exists = USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (exists) return { status: 409, body: { error: "Email already in use" } };

  const passwordHash = await bcrypt.hash(password, 10);
  const user: User = { id: newId(), email, fullName, passwordHash, role: "user" };
  USERS.push(user);

  return { status: 201, body: { id: user.id, email: user.email, fullName: user.fullName, role: user.role } };
}

export async function loginUser(data: unknown) {
  const parsed = AuthSchemas.login.safeParse(data);
  if (!parsed.success) return { status: 400, body: { error: "Invalid body", details: parsed.error.flatten() } };

  const { email, password } = parsed.data;
  const user = USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return { status: 401, body: { error: "Invalid credentials" } };

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return { status: 401, body: { error: "Invalid credentials" } };

  const accessToken = jwt.sign({ email: user.email }, JWT_SECRET, { subject: user.id, expiresIn: "7d" });
  return { status: 200, body: { accessToken } };
}
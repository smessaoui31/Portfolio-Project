import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) throw new Error("Missing JWT_SECRET in .env");

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
});

export async function registerUserPrisma(data: unknown) {
  const parsed = RegisterSchema.safeParse(data);
  if (!parsed.success) {
    return { status: 400, body: { error: "Invalid body", details: parsed.error.flatten() } };
  }

  const { email, password, fullName } = parsed.data;

  // unicité email
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { status: 409, body: { error: "Email already in use" } };

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, fullName, passwordHash, role: "USER" },
    select: { id: true, email: true, fullName: true, role: true },
  });

  return { status: 201, body: user };
}

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function loginUserPrisma(data: unknown) {
  const parsed = LoginSchema.safeParse(data);
  if (!parsed.success) {
    return { status: 400, body: { error: "Invalid body", details: parsed.error.flatten() } };
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { status: 401, body: { error: "Invalid credentials" } };

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return { status: 401, body: { error: "Invalid credentials" } };

  const accessToken = jwt.sign({ email: user.email, role: user.role }, JWT_SECRET, {
    subject: user.id,
    expiresIn: "7d",
  });

  return { status: 200, body: { accessToken, role: user.role } };
}
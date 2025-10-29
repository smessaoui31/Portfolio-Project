// src/services/auth.prisma.service.ts
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) throw new Error("Missing JWT_SECRET in .env");

// -------- Zod schemas (avec normalisation) --------
export const RegisterSchema = z.object({
  email: z
    .string()
    .email()
    .transform((v) => v.trim().toLowerCase()),
  password: z.string().min(6),
  fullName: z
    .string()
    .min(2)
    .transform((v) => v.trim()),
});

export const LoginSchema = z.object({
  email: z
    .string()
    .email()
    .transform((v) => v.trim().toLowerCase()),
  password: z.string().min(1),
});

// -------- Helpers --------
function signAccessToken(payload: { sub: string; email: string; role: string }) {
  const { sub, email, role } = payload;
  return jwt.sign({ email, role }, JWT_SECRET, {
    subject: sub,
    expiresIn: "7d",
  });
}

// -------- Register --------
export async function registerUserPrisma(data: unknown) {
  try {
    const parsed = RegisterSchema.safeParse(data);
    if (!parsed.success) {
      return { status: 400, body: { error: "Invalid body", details: parsed.error.flatten() } };
    }

    const { email, password, fullName } = parsed.data;

    // unicité email
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return { status: 409, body: { error: "Email already in use" } };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, fullName, passwordHash, role: "USER" },
      select: { id: true, email: true, fullName: true, role: true },
    });

    // On renvoie aussi un token pour permettre "auto-login" côté front
    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      status: 201,
      body: {
        accessToken,
        user,
      },
    };
  } catch (err: any) {
    console.error("[registerUserPrisma] error:", err?.message || err);
    return { status: 500, body: { error: "Internal server error" } };
  }
}

// -------- Login --------
export async function loginUserPrisma(data: unknown) {
  try {
    const parsed = LoginSchema.safeParse(data);
    if (!parsed.success) {
      return { status: 400, body: { error: "Invalid body", details: parsed.error.flatten() } };
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, fullName: true, role: true, passwordHash: true },
    });

    if (!user) {
      return { status: 401, body: { error: "Invalid credentials" } };
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return { status: 401, body: { error: "Invalid credentials" } };
    }

    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const publicUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };

    return { status: 200, body: { accessToken, user: publicUser } };
  } catch (err: any) {
    console.error("[loginUserPrisma] error:", err?.message || err);
    return { status: 500, body: { error: "Internal server error" } };
  }
}
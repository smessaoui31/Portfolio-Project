import { z } from "zod";
import { normalizePostalCode } from "@/domain/delivery";
import { editionBounds } from "@/domain/editions";
import { stampBalance } from "@/domain/loyalty";
import type { ServiceWindowLike } from "@/domain/types";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

type Result = { ok: true; id: string } | { ok: false; message: string };
type Done = { ok: true } | { ok: false; message: string };

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide.");
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Heure invalide (format HH:MM).");
const firstIssue = (error: z.ZodError) => error.issues[0]?.message ?? "Informations invalides.";

/* ---------- Editions ---------- */

const editionSchema = z.object({
  id: z.string().optional(),
  number: z.number().int().min(1).max(999),
  productId: z.string().min(1),
  startDate: day,
  endDate: day,
  brothersNote: z.string().trim().min(1, "Le mot des frères est obligatoire.").max(400),
});

export async function listEditionsAdmin() {
  return prisma.edition.findMany({
    orderBy: { number: "desc" },
    include: { product: { select: { id: true, name: true, imageUrl: true } }, _count: { select: { orders: true } } },
  });
}

export async function upsertEdition(input: z.input<typeof editionSchema>): Promise<Result> {
  const parsed = editionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };
  const { id, number, productId, startDate, endDate, brothersNote } = parsed.data;
  if (startDate > endDate) return { ok: false, message: "La date de fin doit suivre la date de début." };

  const product = await prisma.product.findUnique({ where: { id: productId }, include: { category: true } });
  if (!product?.isEditionOnly || !product.category?.isPizza) {
    return { ok: false, message: "Choisis une pizza réservée aux éditions (case à cocher dans la fiche produit)." };
  }

  const bounds = editionBounds(startDate, endDate);
  const overlap = await prisma.edition.findFirst({
    where: { id: id ? { not: id } : undefined, startsAt: { lt: bounds.endsAt }, endsAt: { gt: bounds.startsAt } },
  });
  if (overlap) return { ok: false, message: `Une édition couvre déjà cette période (n°${String(overlap.number).padStart(2, "0")}).` };

  try {
    const data = { number, productId, brothersNote, ...bounds };
    const row = id ? await prisma.edition.update({ where: { id }, data }) : await prisma.edition.create({ data });
    return { ok: true, id: row.id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, message: "Ce numéro d'édition existe déjà." };
    }
    throw error;
  }
}

export async function deleteEdition(id: string): Promise<Done> {
  if ((await prisma.order.count({ where: { editionId: id } })) > 0) {
    return { ok: false, message: "Cette édition a déjà été commandée : elle reste dans l'archive." };
  }
  await prisma.edition.delete({ where: { id } });
  return { ok: true };
}

/* ---------- Delivery zones ---------- */

const zoneSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Le nom est obligatoire.").max(40),
  postalCodes: z.string(),
  feeCents: z.number().int().min(0).max(10_000),
  minOrderCents: z.number().int().min(0).max(100_000),
  isActive: z.boolean(),
});

export async function listZonesAdmin() {
  return prisma.deliveryZone.findMany({ orderBy: { name: "asc" } });
}

export async function upsertZone(input: z.input<typeof zoneSchema>): Promise<Result> {
  const parsed = zoneSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };
  const raw = parsed.data.postalCodes.split(/[,;\n]+/).map((c) => c.trim()).filter(Boolean);
  const tokens = raw.flatMap((chunk) => (normalizePostalCode(chunk) ? [chunk] : chunk.split(/\s+/)));
  const codes: string[] = [];
  for (const token of tokens) {
    const code = normalizePostalCode(token);
    if (!code) return { ok: false, message: `Code postal invalide : ${token}` };
    if (!codes.includes(code)) codes.push(code);
  }
  if (codes.length === 0) return { ok: false, message: "Ajoute au moins un code postal." };

  const { id, ...rest } = parsed.data;
  const data = { ...rest, postalCodes: codes };
  const row = id ? await prisma.deliveryZone.update({ where: { id }, data }) : await prisma.deliveryZone.create({ data });
  return { ok: true, id: row.id };
}

export async function deleteZone(id: string): Promise<void> {
  await prisma.deliveryZone.delete({ where: { id } });
}

/* ---------- Opening hours ---------- */

const windowSchema = z.object({ weekday: z.number().int().min(1).max(7), opensAt: time, closesAt: time });

export async function saveServiceWindows(windows: ServiceWindowLike[]): Promise<Done> {
  const parsed = z.array(windowSchema).max(30).safeParse(windows);
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };
  for (const w of parsed.data) {
    if (w.opensAt >= w.closesAt) return { ok: false, message: `Service ${w.opensAt}–${w.closesAt} : l'ouverture doit précéder la fermeture.` };
  }
  for (let weekday = 1; weekday <= 7; weekday++) {
    const sameDay = parsed.data.filter((w) => w.weekday === weekday).sort((a, b) => a.opensAt.localeCompare(b.opensAt));
    for (let i = 1; i < sameDay.length; i++) {
      if (sameDay[i].opensAt < sameDay[i - 1].closesAt) return { ok: false, message: "Deux services du même jour se chevauchent." };
    }
  }
  await prisma.$transaction([prisma.serviceWindow.deleteMany(), prisma.serviceWindow.createMany({ data: parsed.data })]);
  return { ok: true };
}

export async function addClosure(date: string, reason?: string): Promise<Done> {
  if (!day.safeParse(date).success) return { ok: false, message: "Date invalide." };
  await prisma.closure.upsert({ where: { date }, update: {}, create: { date, reason: reason?.trim() || null } });
  return { ok: true };
}

export async function removeClosure(date: string): Promise<void> {
  await prisma.closure.deleteMany({ where: { date } });
}

/* ---------- Loyalty and timing ---------- */

const loyaltySchema = z.object({
  stampsForReward: z.number().int().min(2, "Entre 2 et 50 tampons.").max(50, "Entre 2 et 50 tampons."),
  featuredProductId: z.string().nullable(),
  pickupLeadMinutes: z.number().int().min(5).max(120),
  deliveryLeadMinutes: z.number().int().min(10).max(180),
  deliveryCutoffMinutes: z.number().int().min(0).max(120).optional(),
});

export async function saveLoyaltySettings(input: z.input<typeof loyaltySchema>): Promise<Done> {
  const parsed = loyaltySchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };
  await prisma.settings.upsert({ where: { id: 1 }, update: parsed.data, create: { id: 1, ...parsed.data } });
  return { ok: true };
}

/* ---------- Users ---------- */

export async function listUsersAdmin() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { loyaltyEntries: { select: { kind: true, stamps: true } }, _count: { select: { orders: true } } },
  });
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    emailVerified: u.emailVerified,
    createdAt: u.createdAt,
    balance: stampBalance(u.loyaltyEntries),
    ordersCount: u._count.orders,
  }));
}

export async function getUserAdmin(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      orders: { orderBy: { createdAt: "desc" }, take: 50, include: { items: { select: { name: true, quantity: true } } } },
      loyaltyEntries: { select: { kind: true, stamps: true } },
    },
  });
}

export async function setUserRole(userId: string, role: "USER" | "ADMIN"): Promise<Done> {
  if (role === "USER") {
    const admins = await prisma.user.count({ where: { role: "ADMIN" } });
    const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (target?.role === "ADMIN" && admins <= 1) return { ok: false, message: "Il faut garder au moins un administrateur." };
  }
  await prisma.user.update({ where: { id: userId }, data: { role } });
  return { ok: true };
}

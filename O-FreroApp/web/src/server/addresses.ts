import { z } from "zod";
import { normalizePostalCode } from "@/domain/delivery";
import { prisma } from "@/lib/db";

const addressSchema = z.object({
  id: z.string().optional(),
  label: z.string().trim().max(40).optional(),
  line1: z.string().trim().min(1).max(120),
  line2: z.string().trim().max(120).optional(),
  postalCode: z.string(),
  city: z.string().trim().min(1).max(60),
  isDefault: z.boolean().optional(),
});

export type AddressInput = z.input<typeof addressSchema>;

export async function listAddresses(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    select: { id: true, label: true, line1: true, line2: true, postalCode: true, city: true, isDefault: true },
  });
}

export async function saveAddress(
  userId: string,
  input: AddressInput,
): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Adresse incomplète." };
  const postalCode = normalizePostalCode(parsed.data.postalCode);
  if (!postalCode) return { ok: false, message: "Ce code postal n'est pas valide." };

  const data = {
    label: parsed.data.label || null,
    line1: parsed.data.line1,
    line2: parsed.data.line2 || null,
    postalCode,
    city: parsed.data.city,
  };

  return prisma.$transaction(async (tx) => {
    const count = await tx.address.count({ where: { userId } });
    const makeDefault = parsed.data.isDefault === true || count === 0;
    if (makeDefault) await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });

    if (parsed.data.id) {
      const { count: updated } = await tx.address.updateMany({
        where: { id: parsed.data.id, userId },
        data: { ...data, ...(makeDefault ? { isDefault: true } : {}) },
      });
      if (updated === 0) return { ok: false as const, message: "Adresse introuvable." };
      return { ok: true as const, id: parsed.data.id };
    }
    const created = await tx.address.create({ data: { ...data, userId, isDefault: makeDefault } });
    return { ok: true as const, id: created.id };
  });
}

export async function setDefaultAddress(userId: string, id: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const owned = await tx.address.findFirst({ where: { id, userId } });
    if (!owned) return;
    await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    await tx.address.update({ where: { id }, data: { isDefault: true } });
  });
}

export async function deleteAddress(userId: string, id: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const owned = await tx.address.findFirst({ where: { id, userId } });
    if (!owned) return;
    await tx.address.delete({ where: { id } });
    if (owned.isDefault) {
      const next = await tx.address.findFirst({ where: { userId }, orderBy: { createdAt: "asc" } });
      if (next) await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  });
}

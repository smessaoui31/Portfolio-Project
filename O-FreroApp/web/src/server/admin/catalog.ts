import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

type Result = { ok: true; id: string } | { ok: false; message: string };
type Done = { ok: true } | { ok: false; message: string };

const imageUrl = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\/images\/[\w./-]+$/.test(v), "Image : un chemin du type /images/pizzas/nom.jpg.")
  .transform((v) => v || null);

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Le nom est obligatoire.").max(60),
  description: z.string().trim().max(300).optional().transform((v) => v || null),
  priceCents: z.number().int().min(0).max(100_000),
  discountPercent: z.number().int().min(0).max(90, "La remise ne peut pas dépasser 90 %."),
  categoryId: z.string().nullable(),
  imageUrl,
  isAvailable: z.boolean(),
  stockQuantity: z.number().int().min(0).nullable(),
  isEditionOnly: z.boolean(),
  supplementIds: z.array(z.string()),
  /** Ordered slots; an existing slot keeps its id so saved carts stay valid. */
  optionGroups: z
    .array(z.object({ id: z.string().optional(), groupId: z.string().min(1), label: z.string().trim().max(40).optional() }))
    .max(12)
    .default([]),
});

export type ProductInput = z.input<typeof productSchema>;

const firstIssue = (error: z.ZodError) => error.issues[0]?.message ?? "Informations invalides.";

export async function listProductsAdmin() {
  return prisma.product.findMany({
    orderBy: [{ category: { displayOrder: "asc" } }, { name: "asc" }],
    include: { category: { select: { name: true } }, _count: { select: { orderItems: true } } },
  });
}

export async function getProductAdmin(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: { supplements: true, optionGroups: { orderBy: { position: "asc" } } },
  });
}

export async function upsertProduct(input: ProductInput): Promise<Result> {
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };
  const { id, supplementIds, optionGroups, ...data } = parsed.data;

  return prisma.$transaction(async (tx) => {
    const product = id
      ? await tx.product.update({ where: { id }, data })
      : await tx.product.create({ data });
    await tx.productSupplement.deleteMany({ where: { productId: product.id, supplementId: { notIn: supplementIds } } });
    await tx.productSupplement.createMany({
      data: supplementIds.map((supplementId) => ({ productId: product.id, supplementId })),
      skipDuplicates: true,
    });
    const kept = optionGroups.flatMap((g) => (g.id ? [g.id] : []));
    await tx.productOptionGroup.deleteMany({ where: { productId: product.id, id: { notIn: kept } } });
    for (const [position, slot] of optionGroups.entries()) {
      const values = { groupId: slot.groupId, label: slot.label || null, position };
      if (slot.id) await tx.productOptionGroup.update({ where: { id: slot.id, productId: product.id }, data: values });
      else await tx.productOptionGroup.create({ data: { ...values, productId: product.id } });
    }
    return { ok: true as const, id: product.id };
  });
}

export async function deleteProduct(id: string): Promise<Done> {
  const [ordered, editions] = await Promise.all([
    prisma.orderItem.count({ where: { productId: id } }),
    prisma.edition.count({ where: { productId: id } }),
  ]);
  if (ordered > 0) return { ok: false, message: "Produit déjà commandé, rends-le indisponible." };
  if (editions > 0) return { ok: false, message: "Produit lié à une édition, supprime d'abord l'édition." };
  await prisma.product.delete({ where: { id } });
  return { ok: true };
}

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Le nom est obligatoire.").max(40),
  description: z.string().trim().max(200).optional().transform((v) => v || null),
  isPizza: z.boolean(),
  isMenu: z.boolean().default(false),
});

export async function listCategoriesAdmin() {
  return prisma.category.findMany({
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });
}

export async function upsertCategory(input: z.input<typeof categorySchema>): Promise<Result> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };
  const { id, ...data } = parsed.data;
  try {
    if (id) {
      await prisma.category.update({ where: { id }, data });
      return { ok: true, id };
    }
    const max = await prisma.category.aggregate({ _max: { displayOrder: true } });
    const created = await prisma.category.create({ data: { ...data, displayOrder: (max._max.displayOrder ?? -1) + 1 } });
    return { ok: true, id: created.id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, message: "Cette catégorie existe déjà." };
    }
    throw error;
  }
}

export async function reorderCategories(ids: string[]): Promise<void> {
  await prisma.$transaction(ids.map((id, index) => prisma.category.update({ where: { id }, data: { displayOrder: index } })));
}

export async function deleteCategory(id: string): Promise<Done> {
  if ((await prisma.product.count({ where: { categoryId: id } })) > 0) {
    return { ok: false, message: "Cette catégorie contient des produits : déplace-les d'abord." };
  }
  await prisma.category.delete({ where: { id } });
  return { ok: true };
}

const supplementSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Le nom est obligatoire.").max(40),
  priceCents: z.number().int().min(0).max(10_000),
  family: z.enum(["CHEESE", "MEAT", "FISH", "VEGETABLE", "OTHER"]).default("OTHER"),
  isActive: z.boolean(),
});

export async function listSupplementsAdmin() {
  return prisma.supplement.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { products: true } } } });
}

export async function upsertSupplement(input: z.input<typeof supplementSchema>): Promise<Result> {
  const parsed = supplementSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };
  const { id, ...data } = parsed.data;
  try {
    const row = id ? await prisma.supplement.update({ where: { id }, data }) : await prisma.supplement.create({ data });
    return { ok: true, id: row.id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, message: "Ce supplément existe déjà." };
    }
    throw error;
  }
}

/** Past orders keep their own copy of supplement names and prices, so deleting is safe. */
export async function deleteSupplement(id: string): Promise<Done> {
  await prisma.supplement.delete({ where: { id } });
  return { ok: true };
}

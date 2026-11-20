import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

type Result = { ok: true; id: string } | { ok: false; message: string };
type Done = { ok: true } | { ok: false; message: string };

const groupSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(1, "Le nom est obligatoire.").max(40),
    minSelect: z.number().int().min(0).max(20),
    maxSelect: z.number().int().min(1, "Au moins un choix possible.").max(20),
    options: z
      .array(
        z.object({
          id: z.string().optional(),
          name: z.string().trim().min(1, "Chaque option a un nom.").max(60),
          priceCents: z.number().int().min(0).max(10_000),
          isActive: z.boolean(),
        }),
      )
      .min(1, "Ajoute au moins une option."),
  })
  .refine((g) => g.minSelect <= g.maxSelect, "Le minimum ne peut pas dépasser le maximum.")
  .refine((g) => new Set(g.options.map((o) => o.name.toLowerCase())).size === g.options.length, "Deux options ont le même nom.");

export type OptionGroupInput = z.input<typeof groupSchema>;

const firstIssue = (error: z.ZodError) => error.issues[0]?.message ?? "Informations invalides.";

export async function listOptionGroupsAdmin() {
  const groups = await prisma.optionGroup.findMany({
    orderBy: { name: "asc" },
    include: { options: { orderBy: { displayOrder: "asc" } }, attachments: { select: { productId: true } } },
  });
  return groups.map(({ attachments, ...group }) => ({ ...group, products: new Set(attachments.map((a) => a.productId)).size }));
}

/** Options keep their id when given one; their order is the list order; missing ones are removed. */
export async function upsertOptionGroup(input: OptionGroupInput): Promise<Result> {
  const parsed = groupSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };
  const { id, options, ...data } = parsed.data;
  try {
    return await prisma.$transaction(async (tx) => {
      const group = id ? await tx.optionGroup.update({ where: { id }, data }) : await tx.optionGroup.create({ data });
      const kept = options.flatMap((o) => (o.id ? [o.id] : []));
      await tx.optionChoice.deleteMany({ where: { groupId: group.id, id: { notIn: kept } } });
      // Free the names first so a rename or a swap does not hit the unique (groupId, name).
      for (const keptId of kept) await tx.optionChoice.update({ where: { id: keptId }, data: { name: `__${keptId}` } });
      for (const [index, option] of options.entries()) {
        const values = { name: option.name, priceCents: option.priceCents, isActive: option.isActive, displayOrder: index };
        if (option.id) await tx.optionChoice.update({ where: { id: option.id, groupId: group.id }, data: values });
        else await tx.optionChoice.create({ data: { ...values, groupId: group.id } });
      }
      return { ok: true as const, id: group.id };
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, message: "Ce groupe existe déjà." };
    }
    throw error;
  }
}

export async function deleteOptionGroup(id: string): Promise<Done> {
  const products = new Set(
    (await prisma.productOptionGroup.findMany({ where: { groupId: id }, select: { productId: true } })).map((a) => a.productId),
  ).size;
  if (products > 0) return { ok: false, message: `Ce groupe est utilisé par ${products} produit(s).` };
  await prisma.optionGroup.delete({ where: { id } });
  return { ok: true };
}

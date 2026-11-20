// Seed: the real menu of ofreropizza.com (prisma/data/catalog.ts), opening hours, the delivery zone,
// the current edition, settings and the admin account. Idempotent: rows are matched by name.
import "dotenv/config";
import { editionBounds } from "../src/domain/editions";
import type { PrismaClient } from "../src/generated/prisma/client";
import { CATEGORIES, EDITION, HOURS, OPTION_GROUPS, SUPPLEMENTS, ZONE, type ProductSeed } from "./data/catalog";

type Ids = { categories: Map<string, string>; groups: Map<string, string>; supplements: string[] };

async function seedOptionGroups(db: PrismaClient): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  for (const g of OPTION_GROUPS) {
    const group = await db.optionGroup.upsert({
      where: { name: g.name },
      update: { minSelect: g.minSelect, maxSelect: g.maxSelect },
      create: { name: g.name, minSelect: g.minSelect, maxSelect: g.maxSelect },
    });
    for (const [displayOrder, o] of g.options.entries()) {
      await db.optionChoice.upsert({
        where: { groupId_name: { groupId: group.id, name: o.name } },
        update: { priceCents: o.priceCents, displayOrder },
        create: { groupId: group.id, name: o.name, priceCents: o.priceCents, displayOrder },
      });
    }
    ids.set(g.name, group.id);
  }
  return ids;
}

/** Creates or updates a product by name; its slots are replaced; pizzas get every supplement. */
async function upsertProduct(
  db: PrismaClient,
  ids: Ids,
  categoryName: string,
  p: ProductSeed,
  o: { isPizza: boolean; isEditionOnly?: boolean },
) {
  const data = {
    name: p.name,
    description: p.description ?? null,
    priceCents: p.priceCents,
    categoryId: ids.categories.get(categoryName)!,
    isEditionOnly: o.isEditionOnly ?? false,
  };
  const existing = await db.product.findFirst({ where: { name: p.name } });
  // Images are left as they are on update: they are set later in the admin.
  const product = existing
    ? await db.product.update({ where: { id: existing.id }, data })
    : await db.product.create({ data: { ...data, imageUrl: null } });

  await db.productOptionGroup.deleteMany({ where: { productId: product.id } });
  await db.productOptionGroup.createMany({
    data: (p.slots ?? []).map((slot, position) => {
      const groupId = ids.groups.get(slot.group);
      if (!groupId) throw new Error(`Groupe de choix inconnu : ${slot.group}`);
      return { productId: product.id, groupId, label: slot.label ?? null, position };
    }),
  });
  if (o.isPizza) {
    await db.productSupplement.createMany({
      data: ids.supplements.map((supplementId) => ({ productId: product.id, supplementId })),
      skipDuplicates: true,
    });
  }
  return product;
}

export async function runSeed(db: PrismaClient): Promise<void> {
  const supplements = [];
  for (const s of SUPPLEMENTS) {
    supplements.push(await db.supplement.upsert({ where: { name: s.name }, update: s, create: s }));
  }
  const ids: Ids = { categories: new Map(), groups: await seedOptionGroups(db), supplements: supplements.map((s) => s.id) };

  for (const [displayOrder, c] of CATEGORIES.entries()) {
    const values = { displayOrder, isPizza: c.isPizza, isMenu: c.isMenu };
    const row = await db.category.upsert({ where: { name: c.name }, update: values, create: { name: c.name, ...values } });
    ids.categories.set(c.name, row.id);
  }
  for (const c of CATEGORIES) {
    for (const p of c.products) await upsertProduct(db, ids, c.name, p, { isPizza: c.isPizza });
  }

  const editionProduct = await upsertProduct(db, ids, EDITION.category, EDITION.product, { isPizza: true, isEditionOnly: true });
  const edition = { productId: editionProduct.id, ...editionBounds(EDITION.start, EDITION.end), brothersNote: EDITION.note };
  await db.edition.upsert({ where: { number: EDITION.number }, update: edition, create: { number: EDITION.number, ...edition } });

  if ((await db.serviceWindow.count()) === 0) await db.serviceWindow.createMany({ data: HOURS });

  const existingZone = await db.deliveryZone.findFirst({ where: { name: ZONE.name } });
  if (existingZone) await db.deliveryZone.update({ where: { id: existingZone.id }, data: ZONE });
  else await db.deliveryZone.create({ data: ZONE });

  await db.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  await seedAdmin(db);
}

async function seedAdmin(db: PrismaClient) {
  const { env } = await import("../src/lib/env");
  const email = env.ADMIN_EMAIL.toLowerCase();
  if (!(await db.user.findUnique({ where: { email } }))) {
    const { auth } = await import("../src/lib/auth");
    await auth.api.signUpEmail({ body: { email, password: env.ADMIN_PASSWORD, name: env.ADMIN_NAME } });
  }
  await db.user.update({ where: { email }, data: { role: "ADMIN", emailVerified: true } });
}

async function main() {
  const { prisma } = await import("../src/lib/db");
  await runSeed(prisma);
  await prisma.$disconnect();
  console.log("Seed terminé.");
}

if (process.argv[1]?.endsWith("seed.ts")) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

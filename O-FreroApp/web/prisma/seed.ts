// Seed: the menu, opening hours, a delivery zone, editions, settings and the admin account.
// Prices and menu items are demo data, editable in the admin. Idempotent.
import "dotenv/config";
import { editionBounds } from "../src/domain/editions";
import type { PrismaClient } from "../src/generated/prisma/client";

const PIZZA = "/images/pizzas";

const HOURS = [
  ...[1, 2, 3, 4].flatMap((weekday) => [
    { weekday, opensAt: "11:30", closesAt: "13:30" },
    { weekday, opensAt: "18:00", closesAt: "22:00" },
  ]),
  { weekday: 5, opensAt: "18:00", closesAt: "22:00" },
  ...[6, 7].flatMap((weekday) => [
    { weekday, opensAt: "12:00", closesAt: "13:30" },
    { weekday, opensAt: "18:00", closesAt: "22:00" },
  ]),
];

type ProductSeed = {
  name: string;
  description: string;
  priceCents: number;
  image: string;
  isEditionOnly?: boolean;
};

const MENU: Record<string, { displayOrder: number; isPizza: boolean; products: ProductSeed[] }> = {
  Pizzas: {
    displayOrder: 0,
    isPizza: true,
    products: [
      { name: "Margherita", description: "Tomate, mozzarella fior di latte, basilic frais", priceCents: 1050, image: "margherita.jpg" },
      { name: "Reine", description: "Tomate, mozzarella, jambon, champignons", priceCents: 1200, image: "reine.jpg" },
      { name: "Pepperoni", description: "Tomate, mozzarella, pepperoni", priceCents: 1250, image: "pepperoni.jpg" },
      { name: "4 Fromages", description: "Mozzarella, gorgonzola, chèvre, parmesan", priceCents: 1300, image: "4-fromages.jpg" },
      { name: "BBQ Chicken", description: "Sauce barbecue, poulet, oignons rouges, mozzarella", priceCents: 1350, image: "bbq-chicken.jpg" },
      { name: "Hawaïenne", description: "Tomate, mozzarella, jambon, ananas", priceCents: 1250, image: "hawaiian.webp" },
    ],
  },
  Desserts: {
    displayOrder: 1,
    isPizza: false,
    products: [
      { name: "Tiramisu", description: "Mascarpone, café, cacao", priceCents: 550, image: "tiramisu.png" },
      { name: "Cannoli", description: "Ricotta sucrée, pistache", priceCents: 450, image: "cannoli.png" },
    ],
  },
  Boissons: {
    displayOrder: 2,
    isPizza: false,
    products: [
      { name: "Coca-Cola 33 cl", description: "Canette", priceCents: 250, image: "coca.jpg" },
      { name: "Oasis Tropical 33 cl", description: "Canette", priceCents: 250, image: "oasistrop.webp" },
      { name: "7Up Mojito 33 cl", description: "Canette", priceCents: 250, image: "7-up-mojito.png" },
    ],
  },
};

const SUPPLEMENTS = [
  { name: "Œuf", priceCents: 100 },
  { name: "Mozzarella", priceCents: 150 },
  { name: "Jambon", priceCents: 200 },
  { name: "Champignons", priceCents: 100 },
  { name: "Piment", priceCents: 50 },
];

const EDITIONS: (ProductSeed & { number: number; start: string; end: string; note: string })[] = [
  {
    number: 7,
    name: "Savoyarde d'hiver",
    description: "Crème, reblochon fermier, pommes de terre fondantes, lardons fumés, oignons confits",
    priceCents: 1490,
    image: "savoyarde.webp",
    start: "2026-11-01",
    end: "2026-12-31",
    note: "L'hiver, on a envie de fromage qui coule. On l'a testée tout le mois d'octobre avant de la lancer.",
  },
  {
    number: 6,
    name: "BBQ fumée",
    description: "Sauce barbecue maison, poulet fumé, oignons rouges, cheddar",
    priceCents: 1390,
    image: "bbq-chicken.jpg",
    start: "2026-09-01",
    end: "2026-10-31",
    note: "Pour la rentrée, une sauce barbecue qu'on fume nous-mêmes au four.",
  },
  {
    number: 5,
    name: "Quatre fromages d'été",
    description: "Mozzarella, burrata, pecorino, chèvre frais, miel de lavande",
    priceCents: 1450,
    image: "4-fromages.jpg",
    start: "2026-07-01",
    end: "2026-08-31",
    note: "Une quatre fromages plus légère, avec un filet de miel pour l'été.",
  },
  {
    number: 4,
    name: "Diavola",
    description: "Tomate, mozzarella, salami piquant, piment de Calabre",
    priceCents: 1350,
    image: "pepperoni.jpg",
    start: "2026-05-01",
    end: "2026-06-30",
    note: "Celle qui pique. Les habitués nous la réclamaient depuis l'ouverture.",
  },
];

async function upsertProduct(db: PrismaClient, categoryId: string, p: ProductSeed) {
  const data = {
    name: p.name,
    description: p.description,
    priceCents: p.priceCents,
    imageUrl: `${PIZZA}/${p.image}`,
    categoryId,
    isEditionOnly: p.isEditionOnly ?? false,
  };
  const existing = await db.product.findFirst({ where: { name: p.name } });
  return existing
    ? db.product.update({ where: { id: existing.id }, data })
    : db.product.create({ data });
}

export async function runSeed(db: PrismaClient): Promise<void> {
  const supplements = await Promise.all(
    SUPPLEMENTS.map((s) => db.supplement.upsert({ where: { name: s.name }, update: s, create: s })),
  );

  let pizzaCategoryId = "";
  for (const [name, category] of Object.entries(MENU)) {
    const row = await db.category.upsert({
      where: { name },
      update: { displayOrder: category.displayOrder, isPizza: category.isPizza },
      create: { name, displayOrder: category.displayOrder, isPizza: category.isPizza },
    });
    if (category.isPizza) pizzaCategoryId = row.id;
    for (const p of category.products) {
      const product = await upsertProduct(db, row.id, p);
      if (category.isPizza) {
        await db.productSupplement.createMany({
          data: supplements.map((s) => ({ productId: product.id, supplementId: s.id })),
          skipDuplicates: true,
        });
      }
    }
  }

  for (const e of EDITIONS) {
    const product = await upsertProduct(db, pizzaCategoryId, { ...e, isEditionOnly: true });
    await db.productSupplement.createMany({
      data: supplements.map((s) => ({ productId: product.id, supplementId: s.id })),
      skipDuplicates: true,
    });
    const data = { productId: product.id, ...editionBounds(e.start, e.end), brothersNote: e.note };
    await db.edition.upsert({ where: { number: e.number }, update: data, create: { number: e.number, ...data } });
  }

  if ((await db.serviceWindow.count()) === 0) await db.serviceWindow.createMany({ data: HOURS });

  const zone = {
    name: "Toulouse",
    postalCodes: ["31000", "31100", "31200", "31300", "31400", "31500"],
    feeCents: 250,
    minOrderCents: 2000,
    isActive: true,
  };
  const existingZone = await db.deliveryZone.findFirst({ where: { name: zone.name } });
  if (existingZone) await db.deliveryZone.update({ where: { id: existingZone.id }, data: zone });
  else await db.deliveryZone.create({ data: zone });

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

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const {
  ADMIN_EMAIL = "admin@ofrero.fr",
  ADMIN_PASSWORD = "admin123",
  ADMIN_FULLNAME = "Site Admin",
} = process.env;

async function main() {
  // Admin
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (!existing) {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        fullName: ADMIN_FULLNAME,
        passwordHash,
        role: "ADMIN",
      },
    });
    console.log(`> Seeded admin: ${ADMIN_EMAIL}`);
  } else {
    console.log(`> Admin already exists: ${ADMIN_EMAIL}`);
  }

  // Catégories
  const pizza = await prisma.category.upsert({
    where: { name: "Pizza" },
    update: {},
    create: { name: "Pizza" },
  });
  const drinks = await prisma.category.upsert({
    where: { name: "Boissons" },
    update: {},
    create: { name: "Boissons" },
  });

  // Produits
  await prisma.product.upsert({
    where: { id: "seed_p1" },
    update: {},
    create: {
      id: "seed_p1",
      name: "Margherita",
      priceCents: 900,
      description: "Tomate, mozzarella, basilic",
      categoryId: pizza.id,
    },
  });

  await prisma.product.upsert({
    where: { id: "seed_p2" },
    update: {},
    create: {
      id: "seed_p2",
      name: "Pepperoni",
      priceCents: 1100,
      description: "Tomate, mozzarella, pepperoni",
      categoryId: pizza.id,
    },
  });

  await prisma.product.upsert({
    where: { id: "seed_d1" },
    update: {},
    create: {
      id: "seed_d1",
      name: "Cola 33cl",
      priceCents: 250,
      description: "Boisson gazeuse",
      categoryId: drinks.id,
    },
  });

  console.log("> Seed done");
}

main().finally(async () => {
  await prisma.$disconnect();
});
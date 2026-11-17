// Empties and reseeds the end-to-end database. Run by global-setup with the .env.test variables.
import { prisma } from "../src/lib/db";
import { resetDb } from "../src/server/test/db";
import { runSeed } from "../prisma/seed";

async function main() {
  if (!process.env.DATABASE_URL?.includes("_test")) throw new Error("Refus : la base de bout en bout doit être une base *_test.");
  await resetDb();
  await runSeed(prisma);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

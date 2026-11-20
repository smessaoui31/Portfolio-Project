// Empties the LOCAL database and fills it with the seed (real menu, hours, zone, edition, admin).
// Usage: npm run db:reseed -- --yes
import "dotenv/config";
import { prisma } from "../src/lib/db";
import { resetDb } from "../src/server/test/db";
import { runSeed } from "../prisma/seed";

async function main() {
  const url = new URL(process.env.DATABASE_URL ?? "postgresql://invalid");
  if (!["localhost", "127.0.0.1"].includes(url.hostname)) {
    throw new Error(`Refus : ${url.hostname} n'est pas une base locale.`);
  }
  if (!process.argv.includes("--yes")) {
    throw new Error("Refus : cette commande vide la base locale. Relance avec --yes pour confirmer.");
  }
  await resetDb();
  await runSeed(prisma);
  await prisma.$disconnect();
  console.log(`Base locale ${url.pathname.slice(1)} vidée puis remplie avec la carte.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

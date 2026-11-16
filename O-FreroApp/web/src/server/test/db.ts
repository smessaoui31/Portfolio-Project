import { prisma } from "@/lib/db";
import { resetFixtureCache } from "./fixtures";

const TABLES = [
  "LoyaltyEntry",
  "Cart",
  "Address",
  "OrderLog",
  "OrderItemSupplement",
  "OrderItem",
  "Order",
  "Edition",
  "ProductSupplement",
  "Supplement",
  "Product",
  "Category",
  "DeliveryZone",
  "ServiceWindow",
  "Closure",
  "Settings",
  "verification",
  "account",
  "session",
  "user",
];

/** Empties every table of the test database. */
export async function resetDb(): Promise<void> {
  const list = TABLES.map((t) => `"${t}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE ${list} RESTART IDENTITY CASCADE`);
  resetFixtureCache();
}

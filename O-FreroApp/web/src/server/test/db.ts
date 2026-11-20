import { prisma } from "@/lib/db";
import { resetFixtureCache } from "./fixtures";

const TABLES = [
  "PollVote",
  "PollCandidate",
  "Poll",
  "OrderRating",
  "MatchNight",
  "LoyaltyEntry",
  "Cart",
  "Address",
  "OrderLog",
  "OrderItemSupplement",
  "OrderItemChoice",
  "OrderItem",
  "Order",
  "Edition",
  "ProductSupplement",
  "Supplement",
  "ProductOptionGroup",
  "OptionChoice",
  "OptionGroup",
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

// Gives stamps to an account on the end-to-end database: tsx e2e/grant-stamps.ts <email> <stamps>
import { prisma } from "../src/lib/db";

async function main() {
  const [email, stamps] = process.argv.slice(2);
  if (!process.env.DATABASE_URL?.includes("_test")) throw new Error("Refus : base *_test uniquement.");
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  const order = await prisma.order.create({
    data: {
      trackingToken: `e2e-stamps-${Date.now()}`,
      userId: user.id,
      customerFirstName: user.name,
      customerPhone: "0612345678",
      customerEmail: email,
      mode: "PICKUP",
      slotAt: new Date("2026-11-01T18:00:00Z"),
      paymentMethod: "AT_PICKUP",
      status: "COMPLETED",
      subtotalCents: 0,
      totalCents: 0,
    },
  });
  await prisma.loyaltyEntry.create({ data: { userId: user.id, orderId: order.id, kind: "EARN", stamps: Number(stamps) } });
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

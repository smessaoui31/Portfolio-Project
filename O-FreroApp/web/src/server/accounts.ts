import { stampsEarned } from "@/domain/loyalty";
import { prisma } from "@/lib/db";

/**
 * Attaches guest orders placed with this e-mail to the account and credits stamps
 * for those already completed. Called after e-mail verification. Idempotent.
 */
export async function attachGuestOrders(
  userId: string,
  email: string,
): Promise<{ attached: number; stampsCredited: number }> {
  const customerEmail = email.toLowerCase();
  return prisma.$transaction(async (tx) => {
    const orders = await tx.order.findMany({
      where: { userId: null, customerEmail },
      select: { id: true, status: true, rewardCents: true, items: { select: { isPizza: true, quantity: true } } },
    });
    if (orders.length === 0) return { attached: 0, stampsCredited: 0 };

    const { count } = await tx.order.updateMany({
      where: { id: { in: orders.map((o) => o.id) }, userId: null },
      data: { userId },
    });

    let stampsCredited = 0;
    for (const order of orders.filter((o) => o.status === "COMPLETED")) {
      const pizzaCount = order.items.filter((i) => i.isPizza).reduce((sum, i) => sum + i.quantity, 0);
      const stamps = stampsEarned({ pizzaCount, rewardCents: order.rewardCents });
      if (stamps === 0) continue;
      const created = await tx.loyaltyEntry.createMany({
        data: [{ userId, orderId: order.id, kind: "EARN", stamps }],
        skipDuplicates: true,
      });
      if (created.count > 0) stampsCredited += stamps;
    }
    return { attached: count, stampsCredited };
  });
}

import type { Prisma } from "@/generated/prisma/client";

/**
 * Gives back what an order reserved: stock of limited products and the redeemed reward.
 * Must run in the same transaction as the status change that ends the order.
 */
export async function releaseOrderResources(tx: Prisma.TransactionClient, orderId: string): Promise<void> {
  const items = await tx.orderItem.findMany({
    where: { orderId },
    select: { productId: true, quantity: true, product: { select: { stockQuantity: true } } },
  });
  for (const item of items) {
    if (item.product.stockQuantity === null) continue;
    await tx.product.update({ where: { id: item.productId }, data: { stockQuantity: { increment: item.quantity } } });
  }
  await tx.loyaltyEntry.deleteMany({ where: { orderId, kind: "REDEEM" } });
}

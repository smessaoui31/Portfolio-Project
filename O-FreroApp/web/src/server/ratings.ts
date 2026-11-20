import { RATING_COMMENT_MAX, type RatingScore } from "@/domain/ratings";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

/** One private rating per completed order, from its tracking link (no account needed). */
export async function rateOrder(
  token: string,
  score: RatingScore,
  comment?: string,
): Promise<{ ok: true } | { ok: false; error: "NOT_FOUND" | "NOT_COMPLETED" | "ALREADY_RATED" | "INVALID" }> {
  const text = comment?.trim() ?? "";
  if (![1, 2, 3].includes(score) || text.length > RATING_COMMENT_MAX) return { ok: false, error: "INVALID" };
  const order = await prisma.order.findUnique({ where: { trackingToken: token }, select: { id: true, status: true } });
  if (!order) return { ok: false, error: "NOT_FOUND" };
  if (order.status !== "COMPLETED") return { ok: false, error: "NOT_COMPLETED" };
  try {
    await prisma.orderRating.create({ data: { orderId: order.id, score, comment: text || null } });
    return { ok: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { ok: false, error: "ALREADY_RATED" };
    throw error;
  }
}

import { createHmac, timingSafeEqual } from "node:crypto";
import { stampsEarned } from "@/domain/loyalty";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

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
      select: { id: true, status: true, mode: true, rewardCents: true, items: { select: { isPizza: true, isMenu: true } } },
    });
    if (orders.length === 0) return { attached: 0, stampsCredited: 0 };

    const { count } = await tx.order.updateMany({
      where: { id: { in: orders.map((o) => o.id) }, userId: null },
      data: { userId },
    });

    let stampsCredited = 0;
    for (const order of orders.filter((o) => o.status === "COMPLETED")) {
      const stamps = stampsEarned({
        mode: order.mode,
        rewardCents: order.rewardCents,
        hasPizzaOrMenu: order.items.some((i) => i.isPizza || i.isMenu),
      });
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

/** Attaches guest orders and remembers that this account proved control of its e-mail. */
export async function linkAccountOrders(userId: string, email: string) {
  const result = await attachGuestOrders(userId, email);
  await prisma.user.updateMany({ where: { id: userId, ordersLinkedAt: null }, data: { ordersLinkedAt: new Date() } });
  return result;
}

/**
 * After e-mail verification: attach only if the link was opened in a browser signed in to
 * this very account. Otherwise someone who signed up with another person's address would
 * collect that person's orders when they click the link.
 */
export async function onEmailVerified(user: { id: string; email: string }, request?: Request): Promise<void> {
  if (!request) return;
  const { auth } = await import("@/lib/auth");
  const session = await auth.api.getSession({ headers: request.headers });
  if (session?.user.id === user.id) await linkAccountOrders(user.id, user.email);
}

/** At each sign-in of an account that proved its e-mail: attach the guest orders placed since. */
export async function onSessionCreated(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, ordersLinkedAt: true } });
  if (user?.ordersLinkedAt) await attachGuestOrders(userId, user.email);
}

const LINK_TTL_MS = 24 * 60 * 60_000;

function sign(payload: string): string {
  return createHmac("sha256", env.BETTER_AUTH_SECRET).update(`orders-link:${payload}`).digest("base64url");
}

/** Signed link (24 h) to attach guest orders from another device, used while signed in. */
export function createOrdersLinkToken(userId: string, email: string, now: Date): string {
  const payload = Buffer.from(JSON.stringify({ u: userId, e: email.toLowerCase(), x: now.getTime() + LINK_TTL_MS })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyOrdersLinkToken(token: string, now: Date): { userId: string; email: string } | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const { u, e, x } = JSON.parse(Buffer.from(payload, "base64url").toString()) as { u: string; e: string; x: number };
    return x > now.getTime() ? { userId: u, email: e } : null;
  } catch {
    return null;
  }
}

/** Opens an orders link: only for the signed-in account (and e-mail) it was issued to. */
export async function redeemOrdersLink(token: string, user: { id: string; email: string }, now: Date): Promise<boolean> {
  const claim = verifyOrdersLinkToken(token, now);
  if (!claim || claim.userId !== user.id || claim.email !== user.email.toLowerCase()) return false;
  await linkAccountOrders(user.id, user.email);
  return true;
}

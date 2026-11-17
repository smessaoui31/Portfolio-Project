import { beforeEach, expect, test, vi } from "vitest";
import { prisma } from "@/lib/db";
import { attachGuestOrders, createOrdersLinkToken, redeemOrdersLink, verifyOrdersLinkToken } from "./accounts";
import { resetDb } from "./test/db";
import { makeOrder, makeUser } from "./test/fixtures";

const sent: { to: string; text: string }[] = [];
vi.mock("@/lib/email", () => ({
  sendEmail: async (msg: { to: string; text: string }) => {
    sent.push(msg);
    return { delivered: false };
  },
}));

beforeEach(async () => {
  await resetDb();
  sent.length = 0;
});

test("attachGuestOrders attaches case-insensitively and credits completed orders", async () => {
  const user = await makeUser({ email: "karim@exemple.fr" });
  await makeOrder({ customerEmail: "karim@exemple.fr", status: "COMPLETED", pizzas: 2 });
  await makeOrder({ customerEmail: "karim@exemple.fr", status: "RECEIVED", pizzas: 1 });
  await makeOrder({ customerEmail: "autre@exemple.fr", status: "COMPLETED", pizzas: 3 });

  expect(await attachGuestOrders(user.id, "Karim@Exemple.fr")).toEqual({ attached: 2, stampsCredited: 2 });
  expect(await prisma.order.count({ where: { userId: user.id } })).toBe(2);
  expect(await attachGuestOrders(user.id, "karim@exemple.fr")).toEqual({ attached: 0, stampsCredited: 0 });
  expect(await prisma.loyaltyEntry.count()).toBe(1);
});

const cookieOf = (res: Response) =>
  res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");

async function signUp(email: string) {
  const { auth } = await import("@/lib/auth");
  const res = await auth.api.signUpEmail({ body: { email, password: "motdepasse1", name: "Nadia" }, asResponse: true });
  const link = sent.findLast((m) => m.to === email.toLowerCase())?.text.match(/https?:\/\/\S+/)?.[0];
  return { cookie: cookieOf(res), link: link! };
}

test("verification attaches guest orders when clicked in the account's own session", async () => {
  const { auth } = await import("@/lib/auth");
  await makeOrder({ customerEmail: "nadia@exemple.fr", status: "COMPLETED", pizzas: 3 });
  const { cookie, link } = await signUp("Nadia@Exemple.fr");
  const user = await prisma.user.findUniqueOrThrow({ where: { email: "nadia@exemple.fr" } });
  expect(user.role).toBe("USER");
  expect(await prisma.order.count({ where: { userId: user.id } })).toBe(0);

  await auth.handler(new Request(link, { headers: { cookie } }));

  const after = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  expect(after.emailVerified).toBe(true);
  expect(after.ordersLinkedAt).not.toBeNull();
  expect(await prisma.order.count({ where: { userId: user.id } })).toBe(1);
  expect(await prisma.loyaltyEntry.aggregate({ where: { userId: user.id }, _sum: { stamps: true } })).toMatchObject({ _sum: { stamps: 3 } });
});

test("someone who signs up with another person's e-mail gets nothing when that person clicks", async () => {
  const { auth } = await import("@/lib/auth");
  await makeOrder({ customerEmail: "victime@exemple.fr", status: "COMPLETED", pizzas: 2 });
  const { link } = await signUp("victime@exemple.fr");
  await auth.handler(new Request(link)); // clicked by the real owner, without the intruder's session
  const user = await prisma.user.findUniqueOrThrow({ where: { email: "victime@exemple.fr" } });
  expect(user.emailVerified).toBe(true);
  expect(user.ordersLinkedAt).toBeNull();
  expect(await prisma.order.count({ where: { userId: user.id } })).toBe(0);

  await auth.api.signInEmail({ body: { email: "victime@exemple.fr", password: "motdepasse1" } });
  expect(await prisma.order.count({ where: { userId: user.id } })).toBe(0);
});

test("a linked account gets its later guest orders at the next sign-in", async () => {
  const { auth } = await import("@/lib/auth");
  const { cookie, link } = await signUp("fidele@exemple.fr");
  await auth.handler(new Request(link, { headers: { cookie } }));
  const user = await prisma.user.findUniqueOrThrow({ where: { email: "fidele@exemple.fr" } });
  await makeOrder({ customerEmail: "fidele@exemple.fr", status: "COMPLETED", pizzas: 2 });

  await auth.api.signInEmail({ body: { email: "fidele@exemple.fr", password: "motdepasse1" } });
  expect(await prisma.order.count({ where: { userId: user.id } })).toBe(1);
  expect(await prisma.loyaltyEntry.aggregate({ where: { userId: user.id }, _sum: { stamps: true } })).toMatchObject({ _sum: { stamps: 2 } });
});

test("orders link tokens are signed, bound to the account and expire", () => {
  const at = new Date("2026-11-19T18:00:00Z");
  const token = createOrdersLinkToken("user-1", "a@b.fr", at);
  expect(verifyOrdersLinkToken(token, at)).toEqual({ userId: "user-1", email: "a@b.fr" });
  expect(verifyOrdersLinkToken(`${token}x`, at)).toBeNull();
  expect(verifyOrdersLinkToken(token, new Date("2026-11-21T18:00:00Z"))).toBeNull();
});

test("sign-up cannot set its own role", async () => {
  const { auth } = await import("@/lib/auth");
  await auth.api
    .signUpEmail({ body: { email: "pirate@exemple.fr", password: "motdepasse1", name: "P", role: "ADMIN" } as never })
    .catch(() => null);
  const user = await prisma.user.findUnique({ where: { email: "pirate@exemple.fr" } });
  expect(user?.role ?? "USER").toBe("USER");
});

test("an orders link only works for the signed-in account it was made for", async () => {
  const owner = await makeUser({ email: "proprio@exemple.fr" });
  const other = await makeUser({ email: "autre@exemple.fr" });
  await makeOrder({ customerEmail: "proprio@exemple.fr", status: "COMPLETED", pizzas: 1 });
  const at = new Date();
  const token = createOrdersLinkToken(owner.id, owner.email, at);

  expect(await redeemOrdersLink(token, { id: other.id, email: other.email }, at)).toBe(false);
  expect(await prisma.order.count({ where: { userId: owner.id } })).toBe(0);
  expect(await redeemOrdersLink(token, { id: owner.id, email: owner.email }, at)).toBe(true);
  expect(await prisma.order.count({ where: { userId: owner.id } })).toBe(1);
  expect((await prisma.user.findUniqueOrThrow({ where: { id: owner.id } })).ordersLinkedAt).not.toBeNull();
});

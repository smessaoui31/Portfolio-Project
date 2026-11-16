import { beforeEach, expect, test, vi } from "vitest";
import { prisma } from "@/lib/db";
import { attachGuestOrders } from "./accounts";
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

test("email verification attaches guest orders, not sign-up alone", async () => {
  const { auth } = await import("@/lib/auth");
  await makeOrder({ customerEmail: "nadia@exemple.fr", status: "COMPLETED", pizzas: 3 });

  await auth.api.signUpEmail({ body: { email: "Nadia@Exemple.fr", password: "motdepasse1", name: "Nadia" } });
  const user = await prisma.user.findUniqueOrThrow({ where: { email: "nadia@exemple.fr" } });
  expect(user.role).toBe("USER");
  expect(await prisma.order.count({ where: { userId: user.id } })).toBe(0);

  const link = sent.find((m) => m.to === "nadia@exemple.fr")?.text.match(/https?:\/\/\S+/)?.[0];
  expect(link).toBeDefined();
  await auth.handler(new Request(link!));

  expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).emailVerified).toBe(true);
  expect(await prisma.order.count({ where: { userId: user.id } })).toBe(1);
  expect(await prisma.loyaltyEntry.aggregate({ where: { userId: user.id }, _sum: { stamps: true } })).toMatchObject({
    _sum: { stamps: 3 },
  });
});

test("sign-up cannot set its own role", async () => {
  const { auth } = await import("@/lib/auth");
  await auth.api
    .signUpEmail({ body: { email: "pirate@exemple.fr", password: "motdepasse1", name: "P", role: "ADMIN" } as never })
    .catch(() => null);
  const user = await prisma.user.findUnique({ where: { email: "pirate@exemple.fr" } });
  expect(user?.role ?? "USER").toBe("USER");
});

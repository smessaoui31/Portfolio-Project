import { beforeEach, expect, test, vi } from "vitest";
import type { CartLineInput } from "@/domain/types";
import { prisma } from "@/lib/db";
import { placeOrder } from "./orders";
import { checkOrderableLines, getLastAccountOrderSummary } from "./reorder";
import { resetDb } from "./test/db";
import { attachGroup, makeHours, makeOptionGroup, makeProduct, makeSupplement, makeUser } from "./test/fixtures";

vi.mock("@/lib/email", () => ({ sendEmail: async () => ({ delivered: false }) }));

const NOW = new Date("2026-11-19T18:02:00Z");

let reine = { id: "" };
let slot = { id: "" };
let large = { id: "" };
let chevre = { id: "" };

beforeEach(async () => {
  await resetDb();
  await makeHours();
  chevre = await makeSupplement({ name: "Chèvre", priceCents: 150 });
  reine = await makeProduct({ name: "Reine", priceCents: 900, supplementIds: [chevre.id] });
  const size = await makeOptionGroup({ name: "Taille", options: [{ name: "Médium 26 cm" }, { name: "Large 33 cm", priceCents: 200 }] });
  large = size.options[1];
  slot = await attachGroup(reine.id, size.id);
});

const line = (over: Partial<CartLineInput & { name: string }> = {}): CartLineInput & { name?: string } => ({
  productId: reine.id,
  quantity: 2,
  cooking: "NORMAL",
  supplementIds: [],
  choices: [{ slotId: slot.id, optionId: large.id }],
  ...over,
});

test("keeps orderable lines and names the skipped ones", async () => {
  const unavailable = await makeProduct({ name: "Hawaïenne", isAvailable: false });
  const r = await checkOrderableLines(
    [
      line(),
      line({ productId: unavailable.id, choices: [], name: "Hawaïenne" }),
      line({ choices: [{ slotId: slot.id, optionId: "gone" }], name: "Reine" }),
    ],
    NOW,
  );
  expect(r.lines).toHaveLength(1);
  expect(r.lines[0]).toMatchObject({ productId: reine.id, quantity: 2, choiceNames: ["Taille : Large 33 cm"] });
  expect(r.skipped).toEqual(["Hawaïenne", "Reine"]);
});

test("a product that no longer exists is skipped with a generic name when none is given", async () => {
  const r = await checkOrderableLines([line({ productId: "nope" })], NOW);
  expect(r).toEqual({ lines: [], skipped: ["Un produit"] });
});

test("drops supplements that are no longer offered but keeps the line", async () => {
  await prisma.productSupplement.deleteMany({ where: { productId: reine.id } });
  const r = await checkOrderableLines([line({ supplementIds: [chevre.id] })], NOW);
  expect(r.lines).toHaveLength(1);
  expect(r.lines[0].supplementIds).toEqual([]);
});

test("placeOrder stores the reorder source", async () => {
  const result = await placeOrder(
    {
      mode: "PICKUP",
      slotAt: "2026-11-19T18:30:00Z",
      paymentMethod: "AT_PICKUP",
      customer: { firstName: "Léa", phone: "0612345678", email: "lea@exemple.fr" },
      lines: [line()],
      source: "REORDER",
    },
    { userId: null, now: NOW },
  );
  if (!result.ok) throw new Error(result.message);
  expect((await prisma.order.findUniqueOrThrow({ where: { id: result.orderId } })).source).toBe("REORDER");
});

test("last account order summary lists items with their choices", async () => {
  const user = await makeUser();
  const placed = await placeOrder(
    {
      mode: "PICKUP",
      slotAt: "2026-11-19T18:30:00Z",
      paymentMethod: "AT_PICKUP",
      customer: { firstName: "Léa", phone: "0612345678", email: user.email },
      lines: [line()],
    },
    { userId: user.id, now: NOW },
  );
  if (!placed.ok) throw new Error(placed.message);
  expect(await getLastAccountOrderSummary(user.id)).toEqual({ orderId: placed.orderId, summary: "2 × Reine · Taille : Large 33 cm" });
  expect(await getLastAccountOrderSummary((await makeUser()).id)).toBeNull();
});

import { beforeEach, describe, expect, test } from "vitest";
import { editionBounds } from "@/domain/editions";
import { prisma } from "@/lib/db";
import { getOrderHistory, reorderLines } from "./account-orders";
import { deleteAddress, listAddresses, saveAddress, setDefaultAddress } from "./addresses";
import { resetDb } from "./test/db";
import { makeEdition, makeOrder, makeProduct, makeSupplement, makeUser } from "./test/fixtures";

beforeEach(resetDb);

describe("order history", () => {
  test("lists only the user's orders, newest first, with a summary", async () => {
    const user = await makeUser();
    const other = await makeUser();
    await makeOrder({ userId: user.id, pizzas: 1, createdAt: new Date("2026-11-01T18:00:00Z") });
    await makeOrder({ userId: user.id, pizzas: 3, createdAt: new Date("2026-11-10T18:00:00Z") });
    await makeOrder({ userId: other.id });
    const history = await getOrderHistory(user.id);
    expect(history).toHaveLength(2);
    expect(history[0].summary).toBe("3 × Pizza test");
    expect(history[1].summary).toBe("1 × Pizza test");
  });

  test("hides orders still waiting for payment", async () => {
    const user = await makeUser();
    await makeOrder({ userId: user.id, status: "PENDING_PAYMENT", paymentMethod: "ONLINE" });
    expect(await getOrderHistory(user.id)).toEqual([]);
  });
});

describe("reorder", () => {
  test("rebuilds the cart lines and skips what can no longer be ordered", async () => {
    const user = await makeUser();
    const egg = await makeSupplement({ name: "Œuf" });
    const marg = await makeProduct({ name: "Margherita", supplementIds: [egg.id] });
    const edition = await makeEdition({ number: 6, ...editionBounds("2026-09-01", "2026-10-31") });
    const editionProduct = await prisma.product.findUniqueOrThrow({ where: { id: edition.productId } });
    await prisma.product.update({ where: { id: editionProduct.id }, data: { name: "BBQ fumée" } });

    const order = await prisma.order.create({
      data: {
        trackingToken: "tok-reorder",
        userId: user.id,
        customerFirstName: "K",
        customerPhone: "0600000000",
        customerEmail: user.email,
        mode: "PICKUP",
        slotAt: new Date("2026-10-10T18:00:00Z"),
        paymentMethod: "AT_PICKUP",
        status: "COMPLETED",
        subtotalCents: 0,
        totalCents: 0,
        items: {
          create: [
            {
              productId: marg.id,
              name: "Margherita",
              unitPriceCents: 1050,
              quantity: 2,
              cooking: "WELL_DONE",
              isPizza: true,
              supplements: { create: [{ supplementId: egg.id, name: "Œuf", unitPriceCents: 100 }] },
            },
            { productId: editionProduct.id, name: "BBQ fumée", unitPriceCents: 1390, quantity: 1, isPizza: true },
          ],
        },
      },
    });

    const result = await reorderLines(user.id, order.id, new Date("2026-11-20T12:00:00Z"));
    expect(result?.lines).toEqual([
      {
        productId: marg.id,
        quantity: 2,
        cooking: "WELL_DONE",
        supplementIds: [egg.id],
        choices: [],
        name: "Margherita",
        imageUrl: null,
        supplementNames: ["Œuf"],
        choiceNames: [],
      },
    ]);
    expect(result?.skipped).toEqual(["BBQ fumée"]);
  });

  test("refuses another user's order", async () => {
    const owner = await makeUser();
    const thief = await makeUser();
    const order = await makeOrder({ userId: owner.id });
    expect(await reorderLines(thief.id, order.id, new Date())).toBeNull();
  });
});

describe("addresses", () => {
  const home = { label: "Maison", line1: "12 rue des Lois", postalCode: "31 000", city: "Toulouse" };

  test("the first address becomes the default and postal codes are normalized", async () => {
    const user = await makeUser();
    const saved = await saveAddress(user.id, home);
    expect(saved).toMatchObject({ ok: true });
    expect(await listAddresses(user.id)).toMatchObject([{ postalCode: "31000", isDefault: true }]);
  });

  test("setting a new default clears the previous one", async () => {
    const user = await makeUser();
    await saveAddress(user.id, home);
    const work = await saveAddress(user.id, { ...home, label: "Bureau", line1: "1 allée Jean Jaurès" });
    if (!work.ok) throw new Error();
    await setDefaultAddress(user.id, work.id);
    const list = await listAddresses(user.id);
    expect(list.filter((a) => a.isDefault).map((a) => a.label)).toEqual(["Bureau"]);
  });

  test("rejects an invalid postal code", async () => {
    const user = await makeUser();
    expect(await saveAddress(user.id, { ...home, postalCode: "310" })).toMatchObject({ ok: false });
  });

  test("users cannot touch each other's addresses", async () => {
    const owner = await makeUser();
    const other = await makeUser();
    const saved = await saveAddress(owner.id, home);
    if (!saved.ok) throw new Error();
    await deleteAddress(other.id, saved.id);
    await setDefaultAddress(other.id, saved.id);
    expect(await saveAddress(other.id, { ...home, id: saved.id, line1: "Piraté" })).toMatchObject({ ok: false });
    expect(await listAddresses(owner.id)).toMatchObject([{ line1: "12 rue des Lois", isDefault: true }]);
    expect(await listAddresses(other.id)).toHaveLength(0);
  });

  test("deleting the default promotes another address", async () => {
    const user = await makeUser();
    const first = await saveAddress(user.id, home);
    await saveAddress(user.id, { ...home, label: "Bureau" });
    if (!first.ok) throw new Error();
    await deleteAddress(user.id, first.id);
    expect(await listAddresses(user.id)).toMatchObject([{ label: "Bureau", isDefault: true }]);
  });
});

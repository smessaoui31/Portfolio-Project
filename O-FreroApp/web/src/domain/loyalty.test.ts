import { expect, test } from "vitest";
import { canRedeem, stampBalance, stampsEarned } from "./loyalty";

test("one stamp per pickup order, whatever the number of pizzas", () => {
  expect(stampsEarned({ mode: "PICKUP", rewardCents: 0, hasPizzaOrMenu: true })).toBe(1);
});

test("no stamp in delivery, with the free pizza, or without pizza or menu", () => {
  expect(stampsEarned({ mode: "DELIVERY", rewardCents: 0, hasPizzaOrMenu: true })).toBe(0);
  expect(stampsEarned({ mode: "PICKUP", rewardCents: 900, hasPizzaOrMenu: true })).toBe(0);
  expect(stampsEarned({ mode: "PICKUP", rewardCents: 0, hasPizzaOrMenu: false })).toBe(0);
});

test("stampBalance and canRedeem", () => {
  expect(stampBalance([{ kind: "EARN", stamps: 12 }, { kind: "REDEEM", stamps: 10 }])).toBe(2);
  expect(stampBalance([])).toBe(0);
  expect(canRedeem(10, 10)).toBe(true);
  expect(canRedeem(9, 10)).toBe(false);
});

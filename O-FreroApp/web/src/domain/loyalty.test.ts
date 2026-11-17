import { expect, test } from "vitest";
import { canRedeem, stampBalance, stampsEarned } from "./loyalty";

test("stampsEarned excludes the free pizza", () => {
  expect(stampsEarned({ pizzaCount: 3, rewardCents: 1050 })).toBe(2);
  expect(stampsEarned({ pizzaCount: 3, rewardCents: 0 })).toBe(3);
  expect(stampsEarned({ pizzaCount: 0, rewardCents: 0 })).toBe(0);
  expect(stampsEarned({ pizzaCount: 1, rewardCents: 1050 })).toBe(0);
});

test("stampBalance and canRedeem", () => {
  expect(stampBalance([{ kind: "EARN", stamps: 12 }, { kind: "REDEEM", stamps: 10 }])).toBe(2);
  expect(stampBalance([])).toBe(0);
  expect(canRedeem(10, 10)).toBe(true);
  expect(canRedeem(9, 10)).toBe(false);
});

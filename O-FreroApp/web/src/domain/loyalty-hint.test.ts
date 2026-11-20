import { expect, test } from "vitest";
import { stampHint } from "./loyalty-hint";

test("delivery shows nothing", () => {
  expect(stampHint({ signedIn: true, mode: "DELIVERY", balance: 3, stampsForReward: 10 })).toBeNull();
  expect(stampHint({ signedIn: false, mode: "DELIVERY", balance: 0, stampsForReward: 10 })).toBeNull();
});

test("a guest is invited to create an account", () => {
  expect(stampHint({ signedIn: false, mode: "PICKUP", balance: 0, stampsForReward: 10 })).toBe(
    "Avec un compte, cette commande te rapporterait 1 tampon.",
  );
  expect(stampHint({ signedIn: false, mode: null, balance: 0, stampsForReward: 10 })).toBe(
    "Avec un compte, cette commande te rapporterait 1 tampon.",
  );
});

test("counts the orders left before the free pizza", () => {
  expect(stampHint({ signedIn: true, mode: "PICKUP", balance: 7, stampsForReward: 10 })).toBe(
    "Cette commande te rapporte 1 tampon : plus que 2 commandes avant ta pizza offerte.",
  );
  expect(stampHint({ signedIn: true, mode: "PICKUP", balance: 8, stampsForReward: 10 })).toBe(
    "Cette commande te rapporte 1 tampon : plus que 1 commande avant ta pizza offerte.",
  );
});

test("the last stamp before the reward", () => {
  expect(stampHint({ signedIn: true, mode: "PICKUP", balance: 9, stampsForReward: 10 })).toBe(
    "Cette commande te rapporte 1 tampon : ta prochaine pizza sera offerte.",
  );
});

test("the reward is ready", () => {
  expect(stampHint({ signedIn: true, mode: null, balance: 10, stampsForReward: 10 })).toBe("Ta pizza offerte t'attend.");
});

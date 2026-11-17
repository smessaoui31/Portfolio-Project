import { expect, test } from "vitest";
import { normalizePostalCode, quoteDelivery, type ZoneLike } from "./delivery";

const ZONES: ZoneLike[] = [
  { id: "z1", name: "Toulouse", postalCodes: ["31000", "31100"], feeCents: 250, minOrderCents: 2000, isActive: true },
  { id: "z2", name: "Fermée", postalCodes: ["31200"], feeCents: 100, minOrderCents: 0, isActive: false },
];

test("normalizePostalCode strips spaces and requires 5 digits", () => {
  expect(normalizePostalCode(" 31 100 ")).toBe("31100");
  expect(normalizePostalCode("31100")).toBe("31100");
  expect(normalizePostalCode("3110")).toBeNull();
  expect(normalizePostalCode("31100a")).toBeNull();
  expect(normalizePostalCode("")).toBeNull();
});

test("quoteDelivery accepts an address in zone with its fee", () => {
  expect(quoteDelivery("31 100", 2500, ZONES)).toMatchObject({ ok: true, feeCents: 250, zone: { id: "z1" } });
});

test("quoteDelivery refuses out of zone, inactive zone, below minimum and invalid codes", () => {
  expect(quoteDelivery("75001", 2500, ZONES)).toMatchObject({ ok: false, reason: "OUT_OF_ZONE" });
  expect(quoteDelivery("31200", 2500, ZONES)).toMatchObject({ ok: false, reason: "OUT_OF_ZONE" });
  expect(quoteDelivery("31100", 1500, ZONES)).toMatchObject({ ok: false, reason: "BELOW_MINIMUM", minOrderCents: 2000 });
  expect(quoteDelivery("3110", 2500, ZONES)).toMatchObject({ ok: false, reason: "INVALID_POSTAL_CODE" });
});

test("minimum is inclusive", () => {
  expect(quoteDelivery("31000", 2000, ZONES)).toMatchObject({ ok: true });
});

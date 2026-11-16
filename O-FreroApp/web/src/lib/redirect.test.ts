import { expect, test } from "vitest";
import { safeNext } from "./redirect";

test("safeNext keeps internal paths only", () => {
  expect(safeNext("/compte")).toBe("/compte");
  expect(safeNext("/commande?etape=2")).toBe("/commande?etape=2");
  expect(safeNext(null)).toBe("/compte");
  expect(safeNext("//evil.com")).toBe("/compte");
  expect(safeNext("/\\evil.com")).toBe("/compte");
  expect(safeNext("https://evil.com")).toBe("/compte");
  expect(safeNext("javascript:alert(1)")).toBe("/compte");
});

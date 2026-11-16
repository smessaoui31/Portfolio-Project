import { expect, test } from "vitest";
import { formatEuros, parseEuros } from "./money";

test("formatEuros formats cents in French", () => {
  expect(formatEuros(1490)).toBe("14,90 €");
  expect(formatEuros(0)).toBe("0,00 €");
  expect(formatEuros(123456)).toBe("1 234,56 €");
});

test("parseEuros reads French and English decimals", () => {
  expect(parseEuros("12,50")).toBe(1250);
  expect(parseEuros("12.5")).toBe(1250);
  expect(parseEuros(" 9 ")).toBe(900);
  expect(parseEuros("0,99")).toBe(99);
  expect(parseEuros("abc")).toBeNull();
  expect(parseEuros("")).toBeNull();
  expect(parseEuros("-3")).toBeNull();
  expect(parseEuros("1,999")).toBeNull();
});

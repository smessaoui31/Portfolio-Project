import { expect, test } from "vitest";
import { formatEuros } from "./money";

test("formatEuros formats cents in French", () => {
  expect(formatEuros(1490)).toBe("14,90 €");
  expect(formatEuros(0)).toBe("0,00 €");
  expect(formatEuros(123456)).toBe("1 234,56 €");
});

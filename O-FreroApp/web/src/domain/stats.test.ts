import { expect, test } from "vitest";
import { median } from "./stats";

test("median", () => {
  expect(median([])).toBeNull();
  expect(median([3, 1, 2])).toBe(2);
  expect(median([1, 2, 3, 4])).toBe(2.5);
});

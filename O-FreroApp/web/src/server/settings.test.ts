import { beforeEach, expect, test } from "vitest";
import { prisma } from "@/lib/db";
import { getSettings } from "./settings";
import { resetDb } from "./test/db";

beforeEach(resetDb);

test("getSettings survives concurrent first calls", async () => {
  const results = await Promise.all(Array.from({ length: 40 }, () => getSettings()));
  expect(results.every((s) => s.id === 1 && s.stampsForReward === 10)).toBe(true);
  expect(await prisma.settings.count()).toBe(1);
});

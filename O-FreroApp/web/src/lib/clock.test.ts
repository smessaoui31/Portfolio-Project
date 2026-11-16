import { afterEach, expect, test, vi } from "vitest";
import { now } from "./clock";

afterEach(() => {
  vi.unstubAllEnvs();
});

test("now() follows OFRERO_NOW outside production", () => {
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("OFRERO_NOW", "2026-11-19T18:02:00Z");
  expect(now().toISOString()).toBe("2026-11-19T18:02:00.000Z");
});

test("now() ignores OFRERO_NOW in production unless E2E is set", () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("OFRERO_NOW", "2026-11-19T18:02:00Z");
  vi.stubEnv("E2E", "");
  expect(Math.abs(now().getTime() - Date.now())).toBeLessThan(1000);
  vi.stubEnv("E2E", "1");
  expect(now().toISOString()).toBe("2026-11-19T18:02:00.000Z");
});

test("now() is the real time without OFRERO_NOW", () => {
  vi.stubEnv("OFRERO_NOW", "");
  expect(Math.abs(now().getTime() - Date.now())).toBeLessThan(1000);
});

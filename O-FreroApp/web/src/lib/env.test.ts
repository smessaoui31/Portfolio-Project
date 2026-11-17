import { describe, expect, test } from "vitest";
import { parseEnv } from "./env";

const validSource = {
  DATABASE_URL: "postgresql://ofrero:ofrero@localhost:5432/ofrero",
  BETTER_AUTH_SECRET: "x".repeat(32),
  BETTER_AUTH_URL: "http://localhost:3000",
  ADMIN_EMAIL: "admin@ofrero.fr",
  ADMIN_PASSWORD: "secret123",
};

describe("parseEnv", () => {
  test("rejects a missing DATABASE_URL", () => {
    expect(() => parseEnv({ ...validSource, DATABASE_URL: undefined })).toThrow(/DATABASE_URL/);
  });

  test("rejects a short BETTER_AUTH_SECRET", () => {
    expect(() => parseEnv({ ...validSource, BETTER_AUTH_SECRET: "short" })).toThrow(/BETTER_AUTH_SECRET/);
  });

  test("applies EMAIL_FROM and ADMIN_NAME defaults", () => {
    const env = parseEnv(validSource);
    expect(env.EMAIL_FROM).toBe("O'Frero <commandes@ofrero.fr>");
    expect(env.ADMIN_NAME).toBe("Admin O'Frero");
  });

  test("treats empty optional keys as absent", () => {
    expect(parseEnv({ ...validSource, RESEND_API_KEY: "" }).RESEND_API_KEY).toBeUndefined();
  });
});

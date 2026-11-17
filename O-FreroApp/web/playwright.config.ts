import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

const testEnv = config({ path: ".env.test", processEnv: {}, quiet: true }).parsed ?? {};
const PORT = 3100;

/** Real Stripe payments run only with E2E_STRIPE=1 and real test keys in .env.test. */
const stripe = process.env.E2E_STRIPE === "1";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  globalSetup: "./e2e/global-setup.ts",
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "fr-FR",
    timezoneId: "Europe/Paris",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    timeout: 300_000,
    reuseExistingServer: false,
    stdout: "ignore",
    env: {
      ...testEnv,
      BETTER_AUTH_URL: `http://localhost:${PORT}`,
      E2E: "1",
      E2E_OUTBOX: "test-results/outbox.jsonl",
      OFRERO_NOW: "2026-11-19T18:02:00Z",
      NEXT_TELEMETRY_DISABLED: "1",
      // Placeholders turn on the online-payment screens; no payment is attempted without E2E_STRIPE.
      STRIPE_SECRET_KEY: stripe ? (testEnv.STRIPE_SECRET_KEY ?? "") : "sk_test_placeholder",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: stripe ? (testEnv.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "") : "pk_test_placeholder",
    },
  },
});

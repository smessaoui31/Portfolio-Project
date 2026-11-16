import { execSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { config } from "dotenv";

/** Test database migrated, emptied and reseeded, and an empty e-mail outbox before each run. */
export default function globalSetup() {
  const testEnv = config({ path: ".env.test", processEnv: {}, quiet: true }).parsed ?? {};
  const env = { ...process.env, ...testEnv };
  execSync("npx prisma migrate deploy", { stdio: "ignore", env });
  execSync("npx tsx --tsconfig tsconfig.json e2e/reset-db.ts", { stdio: ["ignore", "ignore", "inherit"], env });
  mkdirSync("test-results", { recursive: true });
  rmSync("test-results/outbox.jsonl", { force: true });
}

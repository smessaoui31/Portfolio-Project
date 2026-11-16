import { execSync } from "node:child_process";
import { config } from "dotenv";

/** Applies pending migrations to the test database before the integration suite. */
export default function setup() {
  const { parsed } = config({ path: ".env.test", quiet: true, processEnv: {} });
  execSync("npx prisma migrate deploy", {
    stdio: "ignore",
    env: { ...process.env, DATABASE_URL: parsed?.DATABASE_URL },
  });
}

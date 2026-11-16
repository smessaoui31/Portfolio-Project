// Runs a local PostgreSQL 17 without Docker (alternative to `npm run db:up`).
// Data lives in ./.pgdata, the server listens on port 5433 like the Docker setup,
// and the databases `ofrero` and `ofrero_test` are created on first start.
// Stop it with Ctrl+C.
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import EmbeddedPostgres from "embedded-postgres";

const databaseDir = resolve(import.meta.dirname, "..", ".pgdata");
const firstRun = !existsSync(resolve(databaseDir, "PG_VERSION"));

const pg = new EmbeddedPostgres({
  databaseDir,
  user: "ofrero",
  password: "ofrero",
  port: 5433,
  persistent: true,
  onLog: () => {},
});

if (firstRun) await pg.initialise();
await pg.start();

const client = pg.getPgClient("postgres");
await client.connect();
for (const name of ["ofrero", "ofrero_test"]) {
  const { rowCount } = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [name]);
  if (rowCount === 0) await pg.createDatabase(name);
}
await client.end();

console.log("PostgreSQL 17 prêt sur le port 5433 (bases ofrero et ofrero_test). Ctrl+C pour arrêter.");

const stop = async () => {
  await pg.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);

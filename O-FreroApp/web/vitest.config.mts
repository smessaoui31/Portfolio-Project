import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const src = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  resolve: { alias: { "@": src } },
  test: {
    projects: [
      {
        resolve: { alias: { "@": src } },
        test: {
          name: "unit",
          environment: "node",
          include: ["src/domain/**/*.test.ts", "src/lib/**/*.test.ts", "src/emails/**/*.test.ts"],
        },
      },
      {
        resolve: { alias: { "@": src } },
        test: {
          name: "integration",
          environment: "node",
          include: ["src/server/**/*.test.ts", "src/app/**/*.test.ts"],
          setupFiles: ["./src/server/test/load-env.ts"],
          globalSetup: ["./src/server/test/global-setup.ts"],
          fileParallelism: false,
          testTimeout: 30_000,
          hookTimeout: 60_000,
        },
      },
    ],
  },
});

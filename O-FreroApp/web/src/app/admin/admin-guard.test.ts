import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "vitest";

/** Layouts do not protect pages on their own: every admin page must check the role itself. */
test("every admin page calls requireAdmin()", () => {
  const root = path.join(process.cwd(), "src/app/admin");
  const pages = readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile() && e.name === "page.tsx")
    .map((e) => path.join(e.parentPath, e.name));
  expect(pages.length).toBeGreaterThan(10);
  const unguarded = pages.filter((file) => !/await requireAdmin\(\)/.test(readFileSync(file, "utf8")));
  expect(unguarded.map((f) => path.relative(root, f))).toEqual([]);
});

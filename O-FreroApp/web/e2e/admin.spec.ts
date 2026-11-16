import { expect, test } from "@playwright/test";
import { addFromMenu, checkoutPickupAtCounter, signIn, testEnv } from "./helpers";

test("non-admins get a 404 on the admin", async ({ page }) => {
  const response = await page.goto("/admin");
  expect(response?.status()).toBe(404);
});

test("the admin moves an order forward and the tracking page follows", async ({ page, browser }) => {
  await addFromMenu(page, "Reine", 1);
  await checkoutPickupAtCounter(page, { firstName: "Noah", email: "noah@exemple.fr" });
  const tracking = page.url();

  const admin = await browser.newPage();
  await signIn(admin, testEnv.ADMIN_EMAIL!, testEnv.ADMIN_PASSWORD!);
  await admin.goto("/admin/commandes");
  const row = admin.getByRole("link", { name: /· Noah/ });
  await expect(row).toContainText("À ENCAISSER");
  await row.click();
  await admin.getByRole("button", { name: "Mettre au four", exact: true }).click();
  await expect(admin.getByRole("button", { name: "Prête", exact: true })).toBeVisible();
  await admin.getByRole("button", { name: "Prête", exact: true }).click();
  await expect(admin.getByRole("button", { name: "Récupérée", exact: true })).toBeVisible();
  await admin.close();

  await page.goto(tracking);
  const ready = page.getByRole("listitem").filter({ hasText: /^Prête$/ });
  await expect(ready.locator("div")).toHaveClass(/bg-ember/, { timeout: 20_000 });
});

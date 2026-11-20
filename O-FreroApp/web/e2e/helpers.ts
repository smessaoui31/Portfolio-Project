import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { expect, type Page } from "@playwright/test";
import { config } from "dotenv";

export const testEnv = config({ path: ".env.test", processEnv: {}, quiet: true }).parsed ?? {};

/** Last link e-mailed to an address (from the end-to-end outbox). */
export function lastEmailLink(to: string, subjectPart: string): string {
  const lines = readFileSync("test-results/outbox.jsonl", "utf8")
    .trim()
    .split("\n")
    .map((l) => JSON.parse(l) as { to: string; subject: string; text: string })
    .filter((m) => m.to === to && m.subject.includes(subjectPart));
  const link = lines.at(-1)?.text.match(/https?:\/\/\S+/)?.[0];
  if (!link) throw new Error(`Aucun e-mail « ${subjectPart} » pour ${to}`);
  return link;
}

/** Opens the cart from the header bag (adding a product no longer opens it). */
export async function openCart(page: Page) {
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: /^Panier/ }).click();
  await expect(page.getByRole("dialog", { name: "Ton panier" })).toBeVisible();
}

/** Adds a product from the menu page with its default options, then opens the cart. */
export async function addFromMenu(page: Page, productName: string, quantity = 1) {
  await page.goto("/carte");
  await page.getByRole("button", { name: new RegExp(`^${productName},`) }).click();
  for (let i = 1; i < quantity; i++) await page.getByRole("button", { name: "Ajouter un" }).click();
  await page.getByRole("button", { name: /Ajouter au panier/ }).click();
  await expect(page.getByRole("button", { name: /Ajouté/ })).toBeVisible();
  await openCart(page);
}

/** Step 1 pickup at a given time, step 2 details, pay at pickup, then the tracking page. */
export async function checkoutPickupAtCounter(page: Page, customer: { firstName: string; email: string }, time = "19:30") {
  await page.goto("/commande");
  await page.getByRole("button", { name: time, exact: true }).click();
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByLabel("Prénom").fill(customer.firstName);
  await page.getByLabel("Téléphone").fill("06 12 34 56 78");
  await page.getByLabel("E-mail").fill(customer.email);
  await page.getByRole("radio", { name: /Payer au retrait/ }).click();
  await page.getByRole("button", { name: /Valider la commande/ }).click();
  await expect(page).toHaveURL(/\/suivi\/[\w-]+\?nouvelle=1/);
}

export async function signIn(page: Page, email: string, password: string) {
  await page.goto("/compte/connexion");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/compte$/);
}

/** Adds stamps to an account in the end-to-end database. */
export function grantStamps(email: string, stamps: number) {
  execSync(`npx tsx --tsconfig tsconfig.json e2e/grant-stamps.ts ${email} ${stamps}`, {
    stdio: ["ignore", "ignore", "inherit"],
    env: { ...process.env, ...testEnv },
  });
}

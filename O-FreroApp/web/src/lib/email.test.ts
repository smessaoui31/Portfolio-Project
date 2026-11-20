import { afterEach, beforeEach, expect, test, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("DATABASE_URL", "postgresql://x@localhost:5433/x");
  vi.stubEnv("BETTER_AUTH_SECRET", "x".repeat(32));
  vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000");
  vi.stubEnv("ADMIN_EMAIL", "admin@ofrero.fr");
  vi.stubEnv("ADMIN_PASSWORD", "secret123");
  vi.stubEnv("RESEND_API_KEY", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

test("sendEmail without key logs and reports not delivered", async () => {
  const log = vi.spyOn(console, "info").mockImplementation(() => {});
  const { sendEmail } = await import("./email");
  expect(await sendEmail({ to: "a@b.fr", subject: "Sujet", html: "<p>t</p>", text: "corps" })).toEqual({ delivered: false });
  expect(log).toHaveBeenCalledWith("[email]", "a@b.fr", "Sujet", "corps");
});

test("orderConfirmationEmail mentions the slot, tracking link and payment at pickup", async () => {
  const { orderConfirmationEmail } = await import("@/emails/templates");
  const mail = orderConfirmationEmail({
    number: 427,
    firstName: "Karim",
    slotLabel: "jeudi 19 novembre à 20:00",
    modeLabel: "À emporter",
    totalLabel: "26,40 €",
    trackingUrl: "http://localhost:3000/suivi/abc",
    payAtPickup: true,
    items: ["2 × Margarita"],
  });
  expect(mail.subject).toBe("Commande n°0427 confirmée");
  expect(mail.text).toContain("jeudi 19 novembre à 20:00");
  expect(mail.text).toContain("http://localhost:3000/suivi/abc");
  expect(mail.text).toContain("à régler sur place");
  expect(mail.html).toContain('href="http://localhost:3000/suivi/abc"');
});

test("templates escape HTML in user-provided values", async () => {
  const { orderConfirmationEmail } = await import("@/emails/templates");
  const mail = orderConfirmationEmail({
    number: 1,
    firstName: "<b>Karim</b>",
    slotLabel: "x",
    modeLabel: "x",
    totalLabel: "x",
    trackingUrl: "http://x",
    payAtPickup: false,
    items: [],
  });
  expect(mail.html).not.toContain("<b>Karim</b>");
  expect(mail.html).toContain("&lt;b&gt;Karim&lt;/b&gt;");
});

test("in end-to-end runs, messages are appended to the outbox file", async () => {
  const { mkdtemp, readFile } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const path = await import("node:path");
  const dir = await mkdtemp(path.join(tmpdir(), "ofrero-outbox-"));
  const outbox = path.join(dir, "outbox.jsonl");
  vi.stubEnv("E2E", "1");
  vi.stubEnv("E2E_OUTBOX", outbox);
  vi.spyOn(console, "info").mockImplementation(() => {});
  const { sendEmail } = await import("./email");
  await sendEmail({ to: "a@b.fr", subject: "S1", html: "", text: "lien http://x/1" });
  await sendEmail({ to: "c@d.fr", subject: "S2", html: "", text: "lien http://x/2" });
  const lines = (await readFile(outbox, "utf8")).trim().split("\n").map((l) => JSON.parse(l));
  expect(lines.map((l) => [l.to, l.subject])).toEqual([["a@b.fr", "S1"], ["c@d.fr", "S2"]]);
});

test("the outbox is ignored outside end-to-end runs", async () => {
  vi.stubEnv("E2E", "");
  vi.stubEnv("E2E_OUTBOX", "/nonexistent-dir/outbox.jsonl");
  vi.spyOn(console, "info").mockImplementation(() => {});
  const { sendEmail } = await import("./email");
  await expect(sendEmail({ to: "a@b.fr", subject: "S", html: "", text: "t" })).resolves.toEqual({ delivered: false });
});

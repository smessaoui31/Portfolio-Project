import { Resend } from "resend";
import { env } from "@/lib/env";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/** End-to-end runs only: keeps a copy of each message so tests can follow e-mailed links. */
async function writeOutbox(msg: EmailMessage) {
  const outbox = process.env.E2E === "1" ? process.env.E2E_OUTBOX : undefined;
  if (!outbox) return;
  const { appendFile } = await import("node:fs/promises");
  await appendFile(outbox, `${JSON.stringify({ to: msg.to, subject: msg.subject, text: msg.text })}\n`);
}

/** Sends through Resend when RESEND_API_KEY is set; otherwise logs to the server console. */
export async function sendEmail(msg: EmailMessage): Promise<{ delivered: boolean }> {
  await writeOutbox(msg);
  if (!env.RESEND_API_KEY) {
    console.info("[email]", msg.to, msg.subject, msg.text);
    return { delivered: false };
  }
  const { error } = await new Resend(env.RESEND_API_KEY).emails.send({
    from: env.EMAIL_FROM,
    to: msg.to,
    subject: msg.subject,
    html: msg.html,
    text: msg.text,
  });
  if (error) {
    console.error("[email] échec d'envoi", msg.to, msg.subject, error.message);
    return { delivered: false };
  }
  return { delivered: true };
}

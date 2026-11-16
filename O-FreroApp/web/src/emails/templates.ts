import { SITE } from "@/lib/site";

interface Mail {
  subject: string;
  html: string;
  text: string;
}

const escape = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const footerText = `${SITE.name} · ${SITE.address}, ${SITE.postalCity} · ${SITE.phoneDisplay}`;

function layout(title: string, body: string): string {
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#0d0a08;font-family:Arial,Helvetica,sans-serif;color:#f3e9d8">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:520px">
<tr><td style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#ff5a1f;padding-bottom:12px">O'Frero Pizza</td></tr>
<tr><td style="font-size:26px;font-weight:bold;line-height:1.2;padding-bottom:16px">${escape(title)}</td></tr>
<tr><td style="font-size:15px;line-height:1.6;color:#cbbfae">${body}</td></tr>
<tr><td style="font-size:12px;color:#a8998a;padding-top:28px;border-top:1px solid #3a2e25">${escape(footerText)}</td></tr>
</table></td></tr></table></body></html>`;
}

const button = (url: string, label: string) =>
  `<p style="margin:24px 0"><a href="${escape(url)}" style="display:inline-block;background:#ff5a1f;color:#160b05;font-weight:bold;text-decoration:none;padding:12px 20px;border-radius:10px">${escape(label)}</a></p>`;

export function verificationEmail(url: string): Mail {
  return {
    subject: "Confirme ton adresse e-mail",
    text: `Bienvenue chez ${SITE.name}.\n\nConfirme ton adresse en ouvrant ce lien : ${url}\n\nTes commandes passées avec cette adresse seront rattachées à ton compte, avec leurs tampons.\n\n${footerText}`,
    html: layout(
      "Confirme ton adresse",
      `<p>Bienvenue chez ${escape(SITE.name)}.</p><p>Confirme ton adresse pour activer ton compte. Tes commandes passées avec cette adresse y seront rattachées, avec leurs tampons.</p>${button(url, "Confirmer mon adresse")}`,
    ),
  };
}

export function resetPasswordEmail(url: string): Mail {
  return {
    subject: "Réinitialise ton mot de passe",
    text: `Pour choisir un nouveau mot de passe, ouvre ce lien : ${url}\n\nSi tu n'es pas à l'origine de cette demande, ignore ce message.\n\n${footerText}`,
    html: layout(
      "Nouveau mot de passe",
      `<p>Pour choisir un nouveau mot de passe, utilise le bouton ci-dessous.</p>${button(url, "Choisir un mot de passe")}<p>Si tu n'es pas à l'origine de cette demande, ignore ce message.</p>`,
    ),
  };
}

export function orderConfirmationEmail(order: {
  number: number;
  firstName: string;
  slotLabel: string;
  modeLabel: string;
  totalLabel: string;
  trackingUrl: string;
  payAtPickup: boolean;
}): Mail {
  const number = String(order.number).padStart(4, "0");
  const payment = order.payAtPickup ? "à régler sur place" : "payée en ligne";
  return {
    subject: `Commande n°${number} confirmée`,
    text: [
      `Merci ${order.firstName} !`,
      `Ta commande n°${number} est confirmée.`,
      `${order.modeLabel} : ${order.slotLabel}`,
      `Total : ${order.totalLabel} (${payment})`,
      `Suivre ta commande : ${order.trackingUrl}`,
      footerText,
    ].join("\n\n"),
    html: layout(
      `Merci ${order.firstName} !`,
      `<p>Ta commande <strong style="color:#f3e9d8">n°${number}</strong> est confirmée.</p>
<p><strong style="color:#f3e9d8">${escape(order.modeLabel)}</strong> : ${escape(order.slotLabel)}<br>Total : ${escape(order.totalLabel)} (${payment})</p>
${button(order.trackingUrl, "Suivre ma commande")}`,
    ),
  };
}

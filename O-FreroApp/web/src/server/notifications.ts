import { choiceText } from "@/domain/options";
import { orderConfirmationEmail } from "@/emails/templates";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { formatEuros } from "@/lib/money";
import { formatParisDay, formatParisTime } from "@/lib/time";

export function trackingUrl(token: string): string {
  return `${env.BETTER_AUTH_URL.replace(/\/$/, "")}/suivi/${token}`;
}

/** Sends the confirmation e-mail once per order (guarded by confirmationSentAt). */
export async function notifyOrderReceived(orderId: string): Promise<void> {
  const { count } = await prisma.order.updateMany({
    where: { id: orderId, confirmationSentAt: null },
    data: { confirmationSentAt: new Date() },
  });
  if (count === 0) return;

  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: { include: { supplements: true, choices: { orderBy: { id: "asc" } } } } },
  });
  const slot = `${formatParisDay(order.slotAt)} à ${formatParisTime(order.slotAt)}`;
  await sendEmail({
    to: order.customerEmail,
    ...orderConfirmationEmail({
      number: order.number,
      firstName: order.customerFirstName,
      slotLabel: order.mode === "PICKUP" ? slot : `vers ${slot}`,
      modeLabel: order.mode === "PICKUP" ? "À emporter" : "Livraison",
      totalLabel: formatEuros(order.totalCents),
      trackingUrl: trackingUrl(order.trackingToken),
      payAtPickup: order.paymentMethod === "AT_PICKUP",
      items: order.items.map((item) => {
        const details = [...item.choices.map(choiceText), ...item.supplements.map((s) => `+ ${s.name}`)];
        return `${item.quantity} × ${item.name}${details.length > 0 ? ` (${details.join(", ")})` : ""}`;
      }),
    }),
  });
}

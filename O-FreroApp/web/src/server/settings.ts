import type { ZoneLike } from "@/domain/delivery";
import type { SlotOptions } from "@/domain/slots";
import type { FulfillmentMode, ServiceWindowLike } from "@/domain/types";
import { prisma } from "@/lib/db";

export async function getSettings() {
  return prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
}

export async function getServiceWindows(): Promise<ServiceWindowLike[]> {
  return prisma.serviceWindow.findMany({
    select: { weekday: true, opensAt: true, closesAt: true },
    orderBy: [{ weekday: "asc" }, { opensAt: "asc" }],
  });
}

export async function getClosures(): Promise<string[]> {
  return (await prisma.closure.findMany({ select: { date: true }, orderBy: { date: "asc" } })).map((c) => c.date);
}

export async function getActiveZones(): Promise<ZoneLike[]> {
  return prisma.deliveryZone.findMany({ where: { isActive: true } });
}

export async function getSlotOptions(mode: FulfillmentMode, now: Date): Promise<SlotOptions> {
  const [settings, hours, closures] = await Promise.all([getSettings(), getServiceWindows(), getClosures()]);
  return {
    now,
    hours,
    closures,
    leadMinutes: mode === "PICKUP" ? settings.pickupLeadMinutes : settings.deliveryLeadMinutes,
  };
}

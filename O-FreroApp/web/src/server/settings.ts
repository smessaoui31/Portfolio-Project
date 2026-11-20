import type { ZoneLike } from "@/domain/delivery";
import type { SlotOptions } from "@/domain/slots";
import type { FulfillmentMode, ServiceWindowLike } from "@/domain/types";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

/** The single settings row, created with defaults on first use (safe under concurrent first calls). */
export async function getSettings() {
  const existing = await prisma.settings.findUnique({ where: { id: 1 } });
  if (existing) return existing;
  try {
    return await prisma.settings.create({ data: { id: 1 } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return prisma.settings.findUniqueOrThrow({ where: { id: 1 } });
    }
    throw error;
  }
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
    lastSlotBeforeCloseMinutes: mode === "DELIVERY" ? settings.deliveryCutoffMinutes : undefined,
  };
}

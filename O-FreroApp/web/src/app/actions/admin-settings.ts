"use server";

import type { ServiceWindowLike } from "@/domain/types";
import { requireAdmin } from "@/lib/session";
import {
  addClosure,
  deleteEdition,
  deleteZone,
  removeClosure,
  saveLoyaltySettings,
  saveServiceWindows,
  setUserRole,
  upsertEdition,
  upsertZone,
} from "@/server/admin/settings";

export async function saveEditionAction(input: Parameters<typeof upsertEdition>[0]) {
  await requireAdmin();
  return upsertEdition(input);
}

export async function deleteEditionAction(id: string) {
  await requireAdmin();
  return deleteEdition(id);
}

export async function saveZoneAction(input: Parameters<typeof upsertZone>[0]) {
  await requireAdmin();
  return upsertZone(input);
}

export async function deleteZoneAction(id: string) {
  await requireAdmin();
  await deleteZone(id);
}

export async function saveHoursAction(windows: ServiceWindowLike[]) {
  await requireAdmin();
  return saveServiceWindows(windows);
}

export async function addClosureAction(date: string, reason?: string) {
  await requireAdmin();
  return addClosure(date, reason);
}

export async function removeClosureAction(date: string) {
  await requireAdmin();
  await removeClosure(date);
}

export async function saveLoyaltyAction(input: Parameters<typeof saveLoyaltySettings>[0]) {
  await requireAdmin();
  return saveLoyaltySettings(input);
}

export async function setUserRoleAction(userId: string, role: "USER" | "ADMIN") {
  await requireAdmin();
  return setUserRole(userId, role);
}

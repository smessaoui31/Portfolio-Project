"use server";

import { requireAdmin } from "@/lib/session";
import { deleteOptionGroup, upsertOptionGroup, type OptionGroupInput } from "@/server/admin/options";

export async function saveOptionGroupAction(input: OptionGroupInput) {
  await requireAdmin();
  return upsertOptionGroup(input);
}

export async function deleteOptionGroupAction(id: string) {
  await requireAdmin();
  return deleteOptionGroup(id);
}

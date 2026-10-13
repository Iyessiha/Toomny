"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const VALID_ROLES = ["client", "provider", "admin"] as const;
type UserRole = (typeof VALID_ROLES)[number];
const UUID_RE = /^[0-9a-f-]{36}$/i;

export async function changeUserRole(userId: string, role: UserRole): Promise<{ error?: string }> {
  const actor = await requireAdmin();
  if (!UUID_RE.test(userId)) return { error: "invalid id" };
  if (!VALID_ROLES.includes(role)) return { error: "invalid role" };
  if (userId === actor.id) return { error: "cannot change own role" };

  const db = createAdminClient();
  const { error } = await db.from("profiles").update({ role }).eq("id", userId);
  if (error) return { error: error.message };

  revalidatePath("/admin/users");
  return {};
}

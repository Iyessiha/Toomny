"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordAdminAction } from "@/lib/admin-audit";

const MODERATION_STATUSES = ["active", "paused", "removed", "draft"] as const;
type ModerationStatus = (typeof MODERATION_STATUSES)[number];

/**
 * Modération d'une prestation : publier, mettre en pause, retirer ou repasser en brouillon.
 * Seul l'admin peut passer une prestation en « active » : c'est le point de contrôle
 * qui empêche un prestataire de se publier lui-même.
 */
export async function moderateService(formData: FormData): Promise<void> {
  const admin = await requireAdmin();

  const id = String(formData.get("serviceId") ?? "");
  const status = String(formData.get("status") ?? "") as ModerationStatus;

  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  if (!MODERATION_STATUSES.includes(status)) return;

  const db = createAdminClient();
  const { error } = await db
    .from("services")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("moderateService:", error.message);
    return;
  }

  await recordAdminAction(db, {
    actorId: admin.id,
    action: "service.moderate",
    targetType: "service",
    targetId: id,
    details: { status },
  });

  revalidatePath("/admin/services");
  revalidatePath("/services");
}

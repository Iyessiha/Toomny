"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordAdminAction } from "@/lib/admin-audit";

const MODERATION_STATUSES = ["active", "paused", "removed", "draft"] as const;
type ModerationStatus = (typeof MODERATION_STATUSES)[number];
const UUID_RE = /^[0-9a-f-]{36}$/i;

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

export async function editService(formData: FormData): Promise<{ error?: string }> {
  await requireAdmin();

  const id = String(formData.get("serviceId") ?? "");
  if (!UUID_RE.test(id)) return { error: "invalid id" };

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceRaw = Number(formData.get("price_minor"));
  const deliveryRaw = Number(formData.get("delivery_days"));
  const categoryId = String(formData.get("category_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim() as ModerationStatus;

  if (!title) return { error: "title required" };
  if (!MODERATION_STATUSES.includes(status)) return { error: "invalid status" };

  const db = createAdminClient();
  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (title) update.title = title;
  if (description) update.description = description;
  if (!isNaN(priceRaw) && priceRaw > 0) update.price_minor = Math.round(priceRaw);
  if (!isNaN(deliveryRaw) && deliveryRaw > 0) update.delivery_days = Math.round(deliveryRaw);
  if (categoryId && UUID_RE.test(categoryId)) update.category_id = categoryId;
  if (status) update.status = status;

  const { error } = await db.from("services").update(update).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/services");
  revalidatePath(`/admin/services/${id}`);
  revalidatePath("/services");
  revalidatePath(`/services/${id}`);
  return {};
}

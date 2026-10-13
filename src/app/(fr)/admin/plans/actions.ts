"use server";

import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordAdminAction } from "@/lib/admin-audit";
import { isPlanTier, type PlanTier } from "@/lib/plans";
import { revalidatePath } from "next/cache";

export async function setProviderPlan(
  providerId: string,
  tier: string,
  durationDays: number | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const actor = await requireAdmin();

  if (!isPlanTier(tier)) {
    return { ok: false, error: "Plan invalide." };
  }

  const planTier: PlanTier = tier;
  const db = createAdminClient();

  let expiresAt: string | null = null;
  if (planTier !== "debutant" && durationDays !== null && durationDays > 0) {
    const exp = new Date();
    exp.setDate(exp.getDate() + durationDays);
    expiresAt = exp.toISOString();
  } else if (planTier === "debutant") {
    expiresAt = null;
  }

  const { error } = await db
    .from("provider_profiles")
    .update({ plan: planTier, plan_expires_at: expiresAt })
    .eq("profile_id", providerId);

  if (error) return { ok: false, error: error.message };

  await recordAdminAction(db, {
    actorId: actor.id,
    action: "plan.set",
    targetType: "provider",
    targetId: providerId,
    details: { tier: planTier, expires_at: expiresAt },
  });

  revalidatePath("/admin/plans");
  return { ok: true };
}

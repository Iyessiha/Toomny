"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/notifications";
import { getAdminTexts } from "@/i18n/admin";
import { recordAdminAction } from "@/lib/admin-audit";

/**
 * Approuver une demande KYC.
 * Met à jour verifications.status = "verified" et profiles.verification_status = "verified".
 */
export async function approveVerification(verificationId: string) {
  const admin = await requireAdmin();
  const e = getAdminTexts(admin.preferredLocale).errors;
  const db = createAdminClient();

  const { data: verif, error: fetchErr } = await db
    .from("verifications")
    .select("id, profile_id")
    .eq("id", verificationId)
    .maybeSingle();

  if (fetchErr || !verif) return { error: e.notFound };

  const now = new Date().toISOString();

  const { error: verifErr } = await db
    .from("verifications")
    .update({ status: "verified", reviewed_at: now })
    .eq("id", verificationId);

  if (verifErr) return { error: verifErr.message };

  const { error: profErr } = await db
    .from("profiles")
    .update({ verification_status: "verified", updated_at: now })
    .eq("id", verif.profile_id);
  if (profErr) return { error: profErr.message };

  await recordAdminAction(db, {
    actorId: admin.id,
    action: "kyc.approve",
    targetType: "verification",
    targetId: verificationId,
    details: { profileId: verif.profile_id },
  });

  await notify(db, {
    recipientId: verif.profile_id,
    type: "verification_approved",
    link: "/dashboard/verification",
  });

  revalidatePath("/admin/verifications");
  revalidatePath("/admin");
  return { success: true };
}

/**
 * Rejeter une demande KYC avec un motif.
 */
export async function rejectVerification(verificationId: string, reason: string) {
  const admin = await requireAdmin();
  const e = getAdminTexts(admin.preferredLocale).errors;
  const db = createAdminClient();

  const { data: verif, error: fetchErr } = await db
    .from("verifications")
    .select("id, profile_id")
    .eq("id", verificationId)
    .maybeSingle();

  if (fetchErr || !verif) return { error: e.notFound };

  const now = new Date().toISOString();

  const { error: verifErr } = await db
    .from("verifications")
    .update({ status: "rejected", rejection_reason: reason, reviewed_at: now })
    .eq("id", verificationId);

  if (verifErr) return { error: verifErr.message };

  const { error: profErr } = await db
    .from("profiles")
    .update({ verification_status: "rejected", updated_at: now })
    .eq("id", verif.profile_id);
  if (profErr) return { error: profErr.message };

  await recordAdminAction(db, {
    actorId: admin.id,
    action: "kyc.reject",
    targetType: "verification",
    targetId: verificationId,
    details: { profileId: verif.profile_id, reason },
  });

  await notify(db, {
    recipientId: verif.profile_id,
    type: "verification_rejected",
    link: "/dashboard/verification",
  });

  revalidatePath("/admin/verifications");
  revalidatePath("/admin");
  return { success: true };
}

/**
 * Passer une demande en "manual_review" (signaler pour examen approfondi).
 */
export async function flagForManualReview(verificationId: string) {
  const admin = await requireAdmin();
  const e = getAdminTexts(admin.preferredLocale).errors;
  const db = createAdminClient();

  const { error } = await db
    .from("verifications")
    .update({ status: "manual_review" })
    .eq("id", verificationId);
  if (error) return { error: error.message };

  await recordAdminAction(db, {
    actorId: admin.id,
    action: "kyc.flag",
    targetType: "verification",
    targetId: verificationId,
  });

  revalidatePath("/admin/verifications");
  return { success: true };
}

/**
 * Générer une URL signée pour visualiser un document KYC (valable 5 minutes).
 * Retourne { frontUrl, selfieUrl }.
 */
export async function getKycSignedUrls(storagePath: string) {
  const admin = await requireAdmin();
  const e = getAdminTexts(admin.preferredLocale).errors;
  const db = createAdminClient();

  let paths: { front?: string; selfie?: string } = {};
  try {
    paths = JSON.parse(storagePath);
  } catch {
    return { error: e.invalidPath };
  }

  const results: { frontUrl?: string; selfieUrl?: string; error?: string } = {};

  if (paths.front) {
    const { data, error } = await db.storage
      .from("kyc-documents")
      .createSignedUrl(paths.front, 300); // 5 minutes
    if (error || !data) return { error: e.frontMissing };
    results.frontUrl = data.signedUrl;
  }
  if (paths.selfie) {
    const { data, error } = await db.storage
      .from("kyc-documents")
      .createSignedUrl(paths.selfie, 300);
    if (error || !data) return { error: e.selfieMissing };
    results.selfieUrl = data.signedUrl;
  }

  return results;
}

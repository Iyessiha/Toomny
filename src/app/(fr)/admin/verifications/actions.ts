"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Approuver une demande KYC.
 * Met à jour verifications.status = "verified" et profiles.verification_status = "verified".
 */
export async function approveVerification(verificationId: string) {
  await requireAdmin();
  const db = createAdminClient();

  const { data: verif, error: fetchErr } = await db
    .from("verifications")
    .select("id, profile_id")
    .eq("id", verificationId)
    .maybeSingle();

  if (fetchErr || !verif) return { error: "Demande introuvable." };

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

  revalidatePath("/admin/verifications");
  revalidatePath("/admin");
  return { success: true };
}

/**
 * Rejeter une demande KYC avec un motif.
 */
export async function rejectVerification(verificationId: string, reason: string) {
  await requireAdmin();
  const db = createAdminClient();

  const { data: verif, error: fetchErr } = await db
    .from("verifications")
    .select("id, profile_id")
    .eq("id", verificationId)
    .maybeSingle();

  if (fetchErr || !verif) return { error: "Demande introuvable." };

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

  revalidatePath("/admin/verifications");
  revalidatePath("/admin");
  return { success: true };
}

/**
 * Passer une demande en "manual_review" (signaler pour examen approfondi).
 */
export async function flagForManualReview(verificationId: string) {
  await requireAdmin();
  const db = createAdminClient();

  const { error } = await db
    .from("verifications")
    .update({ status: "manual_review" })
    .eq("id", verificationId);
  if (error) return { error: error.message };

  revalidatePath("/admin/verifications");
  return { success: true };
}

/**
 * Générer une URL signée pour visualiser un document KYC (valable 5 minutes).
 * Retourne { frontUrl, selfieUrl }.
 */
export async function getKycSignedUrls(storagePath: string) {
  await requireAdmin();
  const db = createAdminClient();

  let paths: { front?: string; selfie?: string } = {};
  try {
    paths = JSON.parse(storagePath);
  } catch {
    return { error: "Chemin de stockage invalide." };
  }

  const results: { frontUrl?: string; selfieUrl?: string; error?: string } = {};

  if (paths.front) {
    const { data, error } = await db.storage
      .from("kyc-documents")
      .createSignedUrl(paths.front, 300); // 5 minutes
    if (error || !data) return { error: "Document recto introuvable." };
    results.frontUrl = data.signedUrl;
  }
  if (paths.selfie) {
    const { data, error } = await db.storage
      .from("kyc-documents")
      .createSignedUrl(paths.selfie, 300);
    if (error || !data) return { error: "Selfie introuvable." };
    results.selfieUrl = data.signedUrl;
  }

  return results;
}

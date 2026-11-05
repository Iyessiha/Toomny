"use server";

import { sendKycRejectedEmail } from "@/lib/email";
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

  // E-mail explicite avec le motif : le prestataire sait quoi corriger et quoi refaire.
  const [{ data: author }, { data: prof }] = await Promise.all([
    db.auth.admin.getUserById(verif.profile_id),
    db.from("profiles").select("first_name, preferred_locale").eq("id", verif.profile_id).maybeSingle(),
  ]);
  if (author?.user?.email) {
    await sendKycRejectedEmail({
      to: author.user.email,
      firstName: prof?.first_name ?? "",
      reason,
      locale: prof?.preferred_locale === "en" ? "en" : "fr",
    });
  }

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

/** Limite de l'API pour une image : au-delà, l'analyse est refusée. */
const AI_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const EXT_MEDIA: Record<string, "image/jpeg" | "image/png" | "image/webp"> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/**
 * Avis de l'IA sur un dossier KYC. Déclenché à la demande de l'administrateur
 * uniquement ; rien n'est approuvé ni rejeté, et rien n'est conservé hors du
 * journal (verdict et nombre de constats).
 */
export async function analyzeKycDossier(
  verificationId: string,
): Promise<{ review: import("@/lib/ai/kyc-review").KycAiReview } | { error: string }> {
  const admin = await requireAdmin();
  const e = getAdminTexts(admin.preferredLocale).errors;
  const fr = admin.preferredLocale !== "en";
  const msg = (f: string, en: string) => (fr ? f : en);
  if (!/^[0-9a-f-]{36}$/i.test(verificationId)) return { error: e.notFound };

  const db = createAdminClient();
  const { data: verif } = await db
    .from("verifications")
    .select("id, profile_id, document_type, document_country, declared_first_name, declared_last_name, declared_dob, storage_path")
    .eq("id", verificationId)
    .maybeSingle();
  if (!verif) return { error: e.notFound };

  let paths: { front?: string; selfie?: string } = {};
  try {
    paths = JSON.parse(verif.storage_path);
  } catch {
    return { error: e.invalidPath };
  }
  if (!paths.front || !paths.selfie) {
    return { error: msg("Recto et selfie sont requis pour l'analyse.", "Front and selfie are required for the analysis.") };
  }

  const images: { mediaType: "image/jpeg" | "image/png" | "image/webp"; base64: string }[] = [];
  for (const path of [paths.front, paths.selfie]) {
    const ext = path.split(".").pop()?.toLowerCase() ?? "";
    const mediaType = EXT_MEDIA[ext];
    if (!mediaType) {
      return {
        error: msg(
          "Ce fichier est un PDF : l'analyse IA ne lit que les images (JPEG, PNG, WebP). Vérifiez manuellement.",
          "This file is a PDF: the AI analysis only reads images (JPEG, PNG, WebP). Check it manually.",
        ),
      };
    }
    const { data: blob, error: dlErr } = await db.storage.from("kyc-documents").download(path);
    if (dlErr || !blob) return { error: e.frontMissing };
    if (blob.size > AI_IMAGE_MAX_BYTES) {
      return { error: msg("Image trop lourde pour l'analyse IA (5 Mo maximum).", "Image too large for the AI analysis (5 MB max).") };
    }
    images.push({ mediaType, base64: Buffer.from(await blob.arrayBuffer()).toString("base64") });
  }

  const { reviewKycDossier } = await import("@/lib/ai/kyc-review");
  const result = await reviewKycDossier({
    documentType: verif.document_type,
    documentCountry: verif.document_country,
    declaredFirstName: verif.declared_first_name,
    declaredLastName: verif.declared_last_name,
    declaredDob: verif.declared_dob,
    images,
    labels: {
      front: "recto du document d'identité",
      selfie: "selfie du titulaire tenant le document",
    },
  });
  if ("error" in result) return { error: result.error };

  await recordAdminAction(db, {
    actorId: admin.id,
    action: "kyc.ai_review",
    targetType: "verification",
    targetId: verificationId,
    details: { verdict: result.review.verdict, findings: result.review.findings.length },
  });

  return { review: result.review };
}

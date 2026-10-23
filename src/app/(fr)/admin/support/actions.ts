"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordAdminAction } from "@/lib/admin-audit";
import { notify } from "@/lib/notifications";
import { UUID_RE } from "@/lib/orders";
import { validateSupportReply, type SupportLocale } from "@/lib/support-replies";
import { generateAccountAnalysis, generateSupportDraft } from "@/lib/ai/support-draft";
import { readinessForUser } from "@/lib/account-readiness-server";
import { readinessSummary } from "@/lib/account-readiness";
import { parseAttachmentIds, readQuoteFields } from "@/lib/support-attachments";
import { linkAttachments, purgeRequestAttachments } from "@/lib/support-attachments-server";

/** Clôt une demande et supprime ses captures d'écran. Action journalisée. */
export async function closeSupportRequest(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get("requestId") ?? "");
  if (!UUID_RE.test(id)) return;

  const db = createAdminClient();
  const { error } = await db
    .from("support_requests")
    .update({ status: "closed", closed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    console.error("closeSupportRequest:", error.message);
    return;
  }

  await purgeRequestAttachments(db, id);
  await recordAdminAction(db, {
    actorId: admin.id,
    action: "support.close",
    targetType: "support",
    targetId: id,
  });
  revalidatePath("/admin/support");
}

/**
 * Envoie une réponse de l'équipe dans la conversation, avec ses captures et une
 * éventuelle citation. Le demandeur est notifié dans l'application ; l'e-mail
 * n'part que si la règle de quota l'autorise. Journalisé. Refusé si close.
 */
export async function replySupportRequest(
  formData: FormData,
): Promise<{ success: true } | { error: string }> {
  const admin = await requireAdmin();
  const id = String(formData.get("requestId") ?? "");
  if (!UUID_RE.test(id)) return { error: "Demande introuvable." };

  const parsed = validateSupportReply(formData.get("body"));
  if ("error" in parsed) return parsed;

  const attachmentIds = parseAttachmentIds(formData.get("attachmentIds"));

  const db = createAdminClient();
  const { data: request } = await db
    .from("support_requests")
    .select("id, profile_id, status, requester_seen_at")
    .eq("id", id)
    .maybeSingle();
  if (!request) return { error: "Demande introuvable." };
  if (request.status === "closed") return { error: "Cette demande est déjà traitée." };

  const { data: previous } = await db
    .from("support_replies")
    .select("created_at")
    .eq("request_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: inserted, error: insertError } = await db
    .from("support_replies")
    .insert({
      request_id: id,
      author_id: admin.id,
      author_role: "admin",
      body: parsed.body,
      ...readQuoteFields((key) => formData.get(key)),
    })
    .select("id")
    .single();
  if (insertError || !inserted) {
    console.error("replySupportRequest insert:", insertError?.message);
    return { error: "L'envoi de la réponse a échoué. Réessayez." };
  }

  await linkAttachments(db, { ids: attachmentIds, requestId: id, replyId: inserted.id, uploaderId: admin.id });

  const { error: updateError } = await db
    .from("support_requests")
    .update({ replied_at: new Date().toISOString(), awaiting_admin: false })
    .eq("id", id);
  if (updateError) console.error("replySupportRequest update:", updateError.message);

  await notify(db, {
    recipientId: request.profile_id,
    type: "support_replied",
    link: "/dashboard/support",
    // Notification dans l'application seulement : pas d'e-mail, pour préserver le quota d'envoi.
    sendEmail: false,
  });

  await recordAdminAction(db, {
    actorId: admin.id,
    action: "support.reply",
    targetType: "support",
    targetId: id,
  });

  revalidatePath("/admin/support");
  revalidatePath("/dashboard/support");
  return { success: true };
}


/**
 * Brouillon de réponse rédigé par Claude. Rien n'est envoyé : l'administrateur
 * relit le texte dans le formulaire avant de l'envoyer.
 */
export async function draftSupportReply(
  requestId: string,
): Promise<{ text: string } | { error: string }> {
  await requireAdmin();
  if (!UUID_RE.test(requestId)) return { error: "Demande introuvable." };

  const db = createAdminClient();
  const { data: request } = await db
    .from("support_requests")
    .select("subject, body, profile_id")
    .eq("id", requestId)
    .maybeSingle();
  if (!request) return { error: "Demande introuvable." };

  const { data: profile } = await db
    .from("profiles")
    .select("role, preferred_locale")
    .eq("id", request.profile_id)
    .maybeSingle();

  const locale: SupportLocale = profile?.preferred_locale === "en" ? "en" : "fr";
  const requester = await readinessForUser(db, request.profile_id);
  return generateSupportDraft({
    subject: request.subject,
    body: request.body,
    role: profile?.role ?? "client",
    locale,
    readiness: requester ? readinessSummary(requester.readiness) : undefined,
  });
}

/** Analyse le compte du DEMANDEUR (pas celui de l'équipe) et prépare les recommandations. Rien n'est envoyé. */
export async function analyzeRequesterAccount(
  requestId: string,
): Promise<{ text: string } | { error: string }> {
  await requireAdmin();
  if (!UUID_RE.test(requestId)) return { error: "Demande introuvable." };

  const db = createAdminClient();
  const { data: request } = await db
    .from("support_requests")
    .select("subject, body, profile_id")
    .eq("id", requestId)
    .maybeSingle();
  if (!request) return { error: "Demande introuvable." };

  const requester = await readinessForUser(db, request.profile_id);
  if (!requester) return { error: "Compte du demandeur introuvable." };

  const { data: profile } = await db
    .from("profiles")
    .select("preferred_locale")
    .eq("id", request.profile_id)
    .maybeSingle();
  const locale: SupportLocale = profile?.preferred_locale === "en" ? "en" : "fr";

  return generateAccountAnalysis({
    subject: request.subject,
    body: request.body,
    role: requester.role,
    locale,
    factsText: requester.factsText,
    readinessSummary: readinessSummary(requester.readiness),
  });
}

/**
 * Rouvre une conversation résolue. Impossible si son texte a déjà été purgé
 * (rétention de 90 jours) : il n'y a plus rien à reprendre. Journalisé.
 */
export async function reopenSupportRequest(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get("requestId") ?? "");
  if (!UUID_RE.test(id)) return;

  const db = createAdminClient();
  const { data: request } = await db
    .from("support_requests")
    .select("id, status, text_purged_at")
    .eq("id", id)
    .maybeSingle();
  if (!request || request.status !== "closed" || request.text_purged_at) return;

  const { error } = await db
    .from("support_requests")
    .update({ status: "open", closed_at: null, awaiting_admin: false })
    .eq("id", id);
  if (error) {
    console.error("reopenSupportRequest:", error.message);
    return;
  }

  await recordAdminAction(db, {
    actorId: admin.id,
    action: "support.reopen",
    targetType: "support",
    targetId: id,
  });
  revalidatePath("/admin/support");
  revalidatePath("/dashboard/support");
}

/**
 * L'équipe valide l'envoi des éléments manquants au prestataire. Le compte est
 * relu au moment de l'envoi. Le prestataire reçoit une notification et un e-mail.
 */
export async function notifyRequesterMissing(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get("requestId") ?? "");
  if (!UUID_RE.test(id)) return;

  const db = createAdminClient();
  const { data: request } = await db
    .from("support_requests")
    .select("id, profile_id")
    .eq("id", id)
    .maybeSingle();
  if (!request) return;

  const requester = await readinessForUser(db, request.profile_id);
  if (!requester || requester.readiness.missing.length === 0) return;

  const missing = requester.readiness.missing;
  const items = missing.map((c) => c.label.toLowerCase()).join(", ").slice(0, 200);
  const link = missing.some((c) => c.key === "identity") ? "/dashboard/verification" : "/dashboard/profil";

  await notify(db, {
    recipientId: request.profile_id,
    type: "account_missing",
    params: { items },
    link,
    sendEmail: false,
  });

  await recordAdminAction(db, {
    actorId: admin.id,
    action: "account.notify",
    targetType: "support",
    targetId: id,
    details: { missing: missing.map((c) => c.key) },
  });
  revalidatePath("/admin/support");
}

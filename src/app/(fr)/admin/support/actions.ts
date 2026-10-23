"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordAdminAction } from "@/lib/admin-audit";
import { notify } from "@/lib/notifications";
import { UUID_RE } from "@/lib/orders";
import { shouldEmailRecipient, validateSupportReply, type SupportLocale } from "@/lib/support-replies";
import { generateSupportDraft } from "@/lib/ai/support-draft";

/** Marque une demande de contact comme traitée. Action journalisée. */
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

  await recordAdminAction(db, {
    actorId: admin.id,
    action: "support.close",
    targetType: "support",
    targetId: id,
  });
  revalidatePath("/admin/support");
}

/**
 * Envoie une réponse de l'équipe dans la conversation. Le demandeur est notifié
 * dans l'application ; l'e-mail n'part que s'il n'a pas déjà un message non lu
 * (voir shouldEmailRecipient). Journalisé. Refusé si la demande est close.
 */
export async function replySupportRequest(
  formData: FormData,
): Promise<{ success: true } | { error: string }> {
  const admin = await requireAdmin();
  const id = String(formData.get("requestId") ?? "");
  if (!UUID_RE.test(id)) return { error: "Demande introuvable." };

  const parsed = validateSupportReply(formData.get("body"));
  if ("error" in parsed) return parsed;

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

  const { error: insertError } = await db.from("support_replies").insert({
    request_id: id,
    author_id: admin.id,
    author_role: "admin",
    body: parsed.body,
  });
  if (insertError) {
    console.error("replySupportRequest insert:", insertError.message);
    return { error: "L'envoi de la réponse a échoué. Réessayez." };
  }

  const { error: updateError } = await db
    .from("support_requests")
    .update({ replied_at: new Date().toISOString(), awaiting_admin: false })
    .eq("id", id);
  if (updateError) console.error("replySupportRequest update:", updateError.message);

  await notify(db, {
    recipientId: request.profile_id,
    type: "support_replied",
    link: "/dashboard/support",
    sendEmail: shouldEmailRecipient({
      lastMessageAt: previous?.created_at ?? null,
      recipientSeenAt: request.requester_seen_at ?? null,
    }),
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
  return generateSupportDraft({
    subject: request.subject,
    body: request.body,
    role: profile?.role ?? "client",
    locale,
  });
}

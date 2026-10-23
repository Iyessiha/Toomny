"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { consumeRateLimit } from "@/lib/rate-limit";
import { sendSupportRequestEmail } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UUID_RE } from "@/lib/orders";
import { validateSupportReply } from "@/lib/support-replies";
import { parseAttachmentIds, readQuoteFields } from "@/lib/support-attachments";
import { linkAttachments, purgeRequestAttachments } from "@/lib/support-attachments-server";

const MAX_PER_DAY = 5;
const DAY_SECONDS = 24 * 60 * 60;
const REPLY_MAX_PER_DAY = 30;

const MSG = {
  fr: {
    subject: "Indiquez le sujet (120 caractères max).",
    body: "Décrivez votre problème (3 000 caractères max).",
    limit: "Vous avez envoyé beaucoup de demandes aujourd'hui. Réessayez demain.",
    save: "L'envoi a échoué. Réessayez.",
    notFound: "Demande introuvable.",
    closed: "Cette demande est clôturée.",
  },
  en: {
    subject: "Enter a subject (120 characters max).",
    body: "Describe your issue (3,000 characters max).",
    limit: "You have sent many requests today. Please try again tomorrow.",
    save: "Sending failed. Please try again.",
    notFound: "Request not found.",
    closed: "This request is closed.",
  },
} as const;

/** Demande adressée à l'équipe Toomny. Limitée à 5 par jour et par utilisateur. */
export async function sendSupportRequest(formData: FormData): Promise<{ success: true } | { error: string }> {
  const user = await requireAuth();
  const m = MSG[user.preferredLocale];

  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!subject || subject.length > 120) return { error: m.subject };
  if (!body || body.length > 3000) return { error: m.body };

  const allowed = await consumeRateLimit(`support:${user.id}`, MAX_PER_DAY, DAY_SECONDS);
  if (!allowed) return { error: m.limit };

  const supabase = await createClient();
  const { error } = await supabase.from("support_requests").insert({ profile_id: user.id, subject, body });
  if (error) return { error: m.save };

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.displayName || "—";
  await sendSupportRequestEmail({
    fromEmail: user.email ?? "",
    fromName: fullName,
    role: user.role,
    subject,
    body,
  });

  revalidatePath("/dashboard/support");
  return { success: true };
}

/** Le demandeur répond dans sa conversation, avec captures et citation éventuelles. Pas d'e-mail vers l'équipe. */
export async function replyToSupportRequest(
  formData: FormData,
): Promise<{ success: true } | { error: string }> {
  const user = await requireAuth();
  const m = MSG[user.preferredLocale];
  const id = String(formData.get("requestId") ?? "");
  if (!UUID_RE.test(id)) return { error: m.notFound };

  const parsed = validateSupportReply(formData.get("body"));
  if ("error" in parsed) return parsed;

  const allowed = await consumeRateLimit(`support:reply:${user.id}`, REPLY_MAX_PER_DAY, DAY_SECONDS);
  if (!allowed) return { error: m.limit };

  const db = createAdminClient();
  const { data: request } = await db
    .from("support_requests")
    .select("id, status")
    .eq("id", id)
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!request) return { error: m.notFound };
  if (request.status === "closed") return { error: m.closed };

  const { data: inserted, error: insertError } = await db
    .from("support_replies")
    .insert({
      request_id: id,
      author_id: user.id,
      author_role: "requester",
      body: parsed.body,
      ...readQuoteFields((key) => formData.get(key)),
    })
    .select("id")
    .single();
  if (insertError || !inserted) {
    console.error("replyToSupportRequest insert:", insertError?.message);
    return { error: m.save };
  }

  await linkAttachments(db, {
    ids: parseAttachmentIds(formData.get("attachmentIds")),
    requestId: id,
    replyId: inserted.id,
    uploaderId: user.id,
  });

  const { error: updateError } = await db.from("support_requests").update({ awaiting_admin: true }).eq("id", id);
  if (updateError) console.error("replyToSupportRequest update:", updateError.message);

  revalidatePath("/dashboard/support");
  return { success: true };
}

/** Le demandeur indique que sa demande est résolue : elle est close et ses captures sont supprimées. */
export async function resolveSupportRequest(formData: FormData): Promise<void> {
  const user = await requireAuth();
  const m = MSG[user.preferredLocale];
  const id = String(formData.get("requestId") ?? "");
  if (!UUID_RE.test(id)) return;

  const db = createAdminClient();
  const { data: request } = await db
    .from("support_requests")
    .select("id, status")
    .eq("id", id)
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!request || request.status === "closed") return;

  const { error } = await db
    .from("support_requests")
    .update({ status: "closed", closed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    console.error("resolveSupportRequest:", error.message);
    return;
  }

  await purgeRequestAttachments(db, id);
  revalidatePath("/dashboard/support");
}

/** Marque toutes les conversations du demandeur comme vues : la prochaine réponse de l'équipe repartira par e-mail. */
export async function markSupportSeen(): Promise<void> {
  const user = await requireAuth();
  const db = createAdminClient();
  const { error } = await db
    .from("support_requests")
    .update({ requester_seen_at: new Date().toISOString() })
    .eq("profile_id", user.id);
  if (error) console.error("markSupportSeen:", error.message);
}


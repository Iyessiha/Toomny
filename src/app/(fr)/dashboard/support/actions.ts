"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { consumeRateLimit } from "@/lib/rate-limit";
import { sendSupportRequestEmail } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UUID_RE } from "@/lib/orders";
import { validateSupportReply } from "@/lib/support-replies";

const MAX_PER_DAY = 5;
const DAY_SECONDS = 24 * 60 * 60;

const MSG = {
  fr: {
    subject: "Indiquez le sujet (120 caractères max).",
    body: "Décrivez votre problème (3 000 caractères max).",
    limit: "Vous avez envoyé beaucoup de demandes aujourd'hui. Réessayez demain.",
    save: "L'envoi a échoué. Réessayez.",
  },
  en: {
    subject: "Enter a subject (120 characters max).",
    body: "Describe your issue (3,000 characters max).",
    limit: "You have sent many requests today. Please try again tomorrow.",
    save: "Sending failed. Please try again.",
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

const REPLY_MAX_PER_DAY = 30;

/**
 * Le demandeur répond dans sa conversation. Seules ses propres demandes
 * ouvertes acceptent une réponse. Pas d'e-mail vers l'équipe : le badge du
 * tableau de bord admin suffit, ce qui limite la consommation du quota.
 */
export async function replyToSupportRequest(
  formData: FormData,
): Promise<{ success: true } | { error: string }> {
  const user = await requireAuth();
  const id = String(formData.get("requestId") ?? "");
  if (!UUID_RE.test(id)) return { error: "Demande introuvable." };

  const parsed = validateSupportReply(formData.get("body"));
  if ("error" in parsed) return parsed;

  const allowed = await consumeRateLimit(`support:reply:${user.id}`, REPLY_MAX_PER_DAY, DAY_SECONDS);
  if (!allowed) return { error: MSG[user.preferredLocale].limit };

  const db = createAdminClient();
  const { data: request } = await db
    .from("support_requests")
    .select("id, status")
    .eq("id", id)
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!request) return { error: "Demande introuvable." };
  if (request.status === "closed") {
    return { error: user.preferredLocale === "en" ? "This request is closed." : "Cette demande est clôturée." };
  }

  const { error: insertError } = await db.from("support_replies").insert({
    request_id: id,
    author_id: user.id,
    author_role: "requester",
    body: parsed.body,
  });
  if (insertError) {
    console.error("replyToSupportRequest insert:", insertError.message);
    return { error: MSG[user.preferredLocale].save };
  }

  const { error: updateError } = await db
    .from("support_requests")
    .update({ awaiting_admin: true })
    .eq("id", id);
  if (updateError) console.error("replyToSupportRequest update:", updateError.message);

  revalidatePath("/dashboard/support");
  return { success: true };
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

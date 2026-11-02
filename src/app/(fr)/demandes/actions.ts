"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UUID_RE } from "@/lib/orders";
import { getMarketplaceTexts } from "@/i18n/marketplace";
import { notify } from "@/lib/notifications";
import { actorName } from "@/lib/names";
import { isProvider, type CurrentUser } from "@/lib/auth";
import { hasAiAccess } from "@/lib/provider-assist";
import { consumeRateLimit } from "@/lib/rate-limit";
import { draftInquiryReply, type InquiryTurn } from "@/lib/ai/inquiry-reply";

type Result = { error: string } | { success: true };

/**
 * Répondre dans une conversation existante. On ne peut répondre qu'à quelqu'un
 * avec qui on a déjà échangé (dans un sens ou dans l'autre) sur la même
 * prestation : pas de démarchage depuis cette action, le premier contact
 * passe par les formulaires du catalogue.
 */
export async function replyToInquiry(input: {
  toId: string;
  serviceId: string | null;
  message: string;
}): Promise<Result> {
  const user = await requireAuth();
  const e = getMarketplaceTexts(user.preferredLocale).inquiries.errors;

  if (!UUID_RE.test(input.toId)) return { error: e.notFound };
  if (input.serviceId && !UUID_RE.test(input.serviceId)) return { error: e.notFound };
  if (input.toId === user.id) return { error: e.notAllowed };
  const message = input.message.trim();
  if (message.length < 10 || message.length > 1000) return { error: e.length };

  const db = createAdminClient();
  let threadQuery = db
    .from("inquiries")
    .select("id")
    .or(
      `and(from_id.eq.${user.id},to_id.eq.${input.toId}),and(from_id.eq.${input.toId},to_id.eq.${user.id})`,
    )
    .limit(1);
  threadQuery = input.serviceId
    ? threadQuery.eq("service_id", input.serviceId)
    : threadQuery.is("service_id", null);
  const { data: existing } = await threadQuery;
  if (!existing || existing.length === 0) return { error: e.notAllowed };

  const { data: recipient } = await db
    .from("profiles")
    .select("id")
    .eq("id", input.toId)
    .maybeSingle();
  if (!recipient) return { error: e.notFound };

  // Écriture en session : la politique n'autorise que from_id = moi-même.
  const supabase = await createClient();
  const { error } = await supabase.from("inquiries").insert({
    from_id: user.id,
    to_id: input.toId,
    service_id: input.serviceId,
    message,
  });
  if (error) return { error: e.save };

  await notify(db, {
    recipientId: input.toId,
    type: "inquiry_replied",
    params: { from: await actorName(user.id, user.preferredLocale) },
    link: "/demandes",
  });

  revalidatePath("/demandes");
  return { success: true };
}

/**
 * Marquer comme lus les messages reçus d'un interlocuteur dans une
 * conversation. La politique RLS restreint au destinataire (to_id = moi).
 */
export async function markConversationRead(input: {
  otherId: string;
  serviceId: string | null;
}): Promise<Result> {
  const user = await requireAuth();
  const e = getMarketplaceTexts(user.preferredLocale).inquiries.errors;

  if (!UUID_RE.test(input.otherId)) return { error: e.notFound };
  if (input.serviceId && !UUID_RE.test(input.serviceId)) return { error: e.notFound };

  const supabase = await createClient();
  let query = supabase
    .from("inquiries")
    .update({ read_at: new Date().toISOString() })
    .eq("to_id", user.id)
    .eq("from_id", input.otherId)
    .is("read_at", null);
  query = input.serviceId ? query.eq("service_id", input.serviceId) : query.is("service_id", null);

  const { error } = await query;
  if (error) return { error: e.save };

  revalidatePath("/demandes");
  return { success: true };
}

/** Brouillons IA : 30 par heure et par prestataire, comme l'assistant. */
const AI_REPLY_MAX_PER_HOUR = 30;

/**
 * Brouillon de réponse rédigé par l'IA, réservé aux prestataires ayant un plan
 * payant actif. Rien n'est envoyé : la réponse est affichée dans le champ.
 */
export async function draftInquiryReplyWithAi(input: {
  toId: string;
  serviceId: string | null;
}): Promise<{ text: string } | { error: string }> {
  const user: CurrentUser = await requireAuth();
  const locale = user.preferredLocale;
  const fr = locale !== "en";
  const msg = (f: string, en: string) => (fr ? f : en);
  if (!isProvider(user.role)) return { error: msg("Réservé aux prestataires.", "Providers only.") };
  if (!UUID_RE.test(input.toId)) return { error: msg("Demande introuvable.", "Request not found.") };
  if (input.serviceId && !UUID_RE.test(input.serviceId)) return { error: msg("Demande introuvable.", "Request not found.") };

  const db = createAdminClient();
  const { data: profile } = await db
    .from("provider_profiles")
    .select("plan, plan_expires_at")
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!hasAiAccess(profile?.plan, profile?.plan_expires_at ?? null)) {
    return { error: msg("L'assistant IA est inclus dans les plans Essentiel, Pro et Expert.", "The AI assistant is included in the Essentiel, Pro and Expert plans.") };
  }

  const allowed = await consumeRateLimit(`ai:inquiry:${user.id}`, AI_REPLY_MAX_PER_HOUR, 60 * 60);
  if (!allowed) return { error: msg("Limite de l'assistant atteinte pour cette heure.", "Assistant limit reached for this hour.") };

  // Le fil doit exister entre moi et ce client, sur la même prestation.
  let threadQuery = db
    .from("inquiries")
    .select("id")
    .or(`and(from_id.eq.${user.id},to_id.eq.${input.toId}),and(from_id.eq.${input.toId},to_id.eq.${user.id})`)
    .limit(1);
  threadQuery = input.serviceId ? threadQuery.eq("service_id", input.serviceId) : threadQuery.is("service_id", null);
  const { data: existing } = await threadQuery;
  if (!existing || existing.length === 0) return { error: msg("Vous ne pouvez répondre qu'à une demande existante.", "You can only reply to an existing request.") };

  // Dix derniers messages du fil, du plus ancien au plus récent.
  let historyQuery = db
    .from("inquiries")
    .select("from_id, message, created_at")
    .or(`and(from_id.eq.${user.id},to_id.eq.${input.toId}),and(from_id.eq.${input.toId},to_id.eq.${user.id})`)
    .order("created_at", { ascending: false })
    .limit(10);
  historyQuery = input.serviceId ? historyQuery.eq("service_id", input.serviceId) : historyQuery.is("service_id", null);
  const { data: history } = await historyQuery;
  const turns: InquiryTurn[] = (history ?? [])
    .reverse()
    .map((h) => ({ mine: h.from_id === user.id, message: String(h.message) }));

  let serviceTitle: string | null = null;
  if (input.serviceId) {
    const { data: service } = await db.from("services").select("title").eq("id", input.serviceId).maybeSingle();
    serviceTitle = (service?.title as string | undefined) ?? null;
  }

  return draftInquiryReply({ turns, serviceTitle, locale: fr ? "fr" : "en" });
}

/** Modifier mon propre message (le texte seul, via une fonction SQL réservée à l'expéditeur). */
export async function editInquiryMessage(input: { id: string; message: string }): Promise<Result> {
  const user = await requireAuth();
  const e = getMarketplaceTexts(user.preferredLocale).inquiries.errors;
  if (!UUID_RE.test(input.id)) return { error: e.notFound };
  const message = input.message.trim();
  if (message.length < 10 || message.length > 1000) return { error: e.length };

  const supabase = await createClient();
  const { error } = await supabase.rpc("edit_inquiry_message", { p_id: input.id, p_message: message });
  if (error) return { error: e.save };

  revalidatePath("/demandes");
  return { success: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UUID_RE } from "@/lib/orders";
import { getMarketplaceTexts } from "@/i18n/marketplace";
import { notify } from "@/lib/notifications";
import { actorName } from "@/lib/names";

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

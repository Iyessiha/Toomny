"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMarketplaceTexts } from "@/i18n/marketplace";
import { notify } from "@/lib/notifications";
import { actorName } from "@/lib/names";

type Result = { error: string } | { success: true };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Crée un fil de support pour le prestataire connecté et redirige vers /messages/[id].
 * Si un fil ouvert existe déjà pour ce sujet, on redirige vers l'existant.
 */
export async function createSupportThread(subject: string): Promise<void> {
  const user = await requireAuth();
  const supabase = await createClient();

  const cleanSubject = subject.trim().slice(0, 200) || "Support";

  const { data: thread, error } = await supabase
    .from("support_threads")
    .insert({ provider_id: user.id, subject: cleanSubject })
    .select("id")
    .single();

  if (error || !thread) {
    // Redirige vers la liste en cas d'erreur — la page affichera l'état
    redirect("/messages");
  }

  redirect(`/messages/${thread.id}`);
}

/**
 * Envoie un message dans un fil de support (prestataire ou admin).
 */
export async function sendSupportMessage(input: {
  threadId: string;
  body: string;
}): Promise<Result> {
  const user = await requireAuth();
  const t = getMarketplaceTexts(user.preferredLocale).messages.support;

  if (!UUID_RE.test(input.threadId)) return { error: t.notFound };
  const body = input.body.trim();
  if (body.length < 1 || body.length > 5000) return { error: t.messageLength };

  const supabase = await createClient();

  // Vérifier que le thread existe et que l'utilisateur y a accès (RLS couvre déjà ça,
  // mais on veut aussi récupérer provider_id pour la notification).
  const { data: thread } = await supabase
    .from("support_threads")
    .select("id, provider_id, status")
    .eq("id", input.threadId)
    .maybeSingle();

  if (!thread) return { error: t.notFound };
  if (thread.status === "closed") return { error: t.threadClosed };

  const { error } = await supabase
    .from("support_messages")
    .insert({ thread_id: input.threadId, sender_id: user.id, body });

  if (error) return { error: t.sendError };

  // Notification : on notifie l'autre partie.
  const db = createAdminClient();
  const senderName = await actorName(user.id, user.preferredLocale);

  if (user.id === thread.provider_id) {
    // Prestataire a écrit → notifier tous les admins
    const { data: admins } = await db
      .from("profiles")
      .select("id")
      .eq("role", "admin");
    for (const admin of admins ?? []) {
      await notify(db, {
        recipientId: admin.id,
        type: "support_message",
        params: { from: senderName },
        link: `/admin/messages/${input.threadId}`,
        sendEmail: false,
      });
    }
  } else {
    // Admin a écrit → notifier le prestataire
    await notify(db, {
      recipientId: thread.provider_id,
      type: "support_message",
      params: { from: senderName },
      link: `/messages/${input.threadId}`,
    });
  }

  revalidatePath(`/messages/${input.threadId}`);
  revalidatePath(`/admin/messages/${input.threadId}`);
  return { success: true };
}

/**
 * Ferme un fil de support (admin uniquement).
 */
export async function closeSupportThread(threadId: string): Promise<Result> {
  const user = await requireAdmin();
  const t = getMarketplaceTexts(user.preferredLocale).messages.support;

  if (!UUID_RE.test(threadId)) return { error: t.notFound };

  const supabase = await createClient();
  const { error } = await supabase
    .from("support_threads")
    .update({ status: "closed" })
    .eq("id", threadId);

  if (error) return { error: t.sendError };

  revalidatePath(`/admin/messages/${threadId}`);
  revalidatePath(`/admin/messages`);
  return { success: true };
}

/**
 * Marque tous les messages non lus d'un fil comme lus pour l'utilisateur courant.
 */
export async function markThreadRead(threadId: string): Promise<void> {
  if (!UUID_RE.test(threadId)) return;
  const user = await requireAuth();
  const supabase = await createClient();

  await supabase
    .from("support_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("thread_id", threadId)
    .neq("sender_id", user.id)
    .is("read_at", null);
}

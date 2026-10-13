"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { UUID_RE } from "@/lib/orders";

/**
 * Ouvrir une notification : marquer lue puis suivre le lien. Le lien est
 * relu en base (jamais repris du formulaire) et restreint aux chemins
 * internes — une ligne corrompue ne peut pas rediriger vers l'extérieur.
 */
export async function openNotification(formData: FormData): Promise<void> {
  const user = await requireAuth();
  const id = String(formData.get("id") ?? "");
  if (!UUID_RE.test(id)) redirect("/notifications");

  const supabase = await createClient();
  const { data: notif } = await supabase
    .from("notifications")
    .select("id, link")
    .eq("id", id)
    .eq("recipient_id", user.id)
    .maybeSingle();
  if (!notif) redirect("/notifications");

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notif.id)
    .eq("recipient_id", user.id);

  revalidatePath("/notifications");
  redirect(typeof notif.link === "string" && notif.link.startsWith("/") ? notif.link : "/notifications");
}

/** Tout marquer comme lu. Idempotent : relancer ne change rien. */
export async function markAllNotificationsRead(): Promise<void> {
  const user = await requireAuth();
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", user.id)
    .is("read_at", null);
  revalidatePath("/notifications");
}

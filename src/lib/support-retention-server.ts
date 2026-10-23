import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { PURGED_BODY, PURGED_SUBJECT, retentionCutoff } from "@/lib/support-retention";

const BATCH = 200;

/**
 * Efface le texte des demandes clôturées depuis plus du délai de rétention :
 * sujet et message remplacés, réponses supprimées. La ligne reste (statut, dates)
 * et est marquée text_purged_at pour ne pas être traitée deux fois.
 */
export async function purgeExpiredSupportText(db: SupabaseClient, now: Date = new Date()): Promise<number> {
  const { data: rows, error } = await db
    .from("support_requests")
    .select("id")
    .eq("status", "closed")
    .lt("closed_at", retentionCutoff(now))
    .is("text_purged_at", null)
    .limit(BATCH);
  if (error) {
    console.error("purgeExpiredSupportText select:", error.message);
    return 0;
  }
  if (!rows || rows.length === 0) return 0;

  const ids = rows.map((r) => r.id);
  const { error: repliesError } = await db.from("support_replies").delete().in("request_id", ids);
  if (repliesError) console.error("purgeExpiredSupportText replies:", repliesError.message);

  const { error: updateError } = await db
    .from("support_requests")
    .update({
      subject: PURGED_SUBJECT,
      body: PURGED_BODY,
      text_purged_at: now.toISOString(),
    })
    .in("id", ids);
  if (updateError) {
    console.error("purgeExpiredSupportText update:", updateError.message);
    return 0;
  }
  return ids.length;
}

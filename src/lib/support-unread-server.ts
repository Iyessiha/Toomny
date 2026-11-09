import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Nombre de demandes ouvertes où l'équipe a répondu depuis la dernière ouverture
 * par le demandeur. Alimente le badge de navigation et la notification de la section.
 */
export async function unreadSupportCount(db: SupabaseClient, userId: string): Promise<number> {
  const { data: requests } = await db
    .from("support_requests")
    .select("id, requester_seen_at")
    .eq("profile_id", userId)
    .eq("status", "open");
  if (!requests || requests.length === 0) return 0;

  const { data: replies } = await db
    .from("support_replies")
    .select("request_id, created_at")
    .in("request_id", requests.map((r) => r.id))
    .eq("author_role", "admin");

  const lastTeamAt = new Map<string, string>();
  for (const reply of replies ?? []) {
    const current = lastTeamAt.get(reply.request_id);
    if (!current || reply.created_at > current) lastTeamAt.set(reply.request_id, reply.created_at);
  }

  return requests.filter((r) => {
    const last = lastTeamAt.get(r.id);
    return Boolean(last) && (!r.requester_seen_at || (last as string) > r.requester_seen_at);
  }).length;
}

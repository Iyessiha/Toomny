import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Fin de la période en cours d'un prestataire (abonnement ou boost), si elle n'est pas
 * encore passée. Un renouvellement démarre à cette date au lieu de maintenant : le temps
 * restant n'est pas perdu.
 */
export async function activeUntil(
  db: SupabaseClient,
  table: "subscriptions" | "boosts",
  providerId: string,
  now: Date,
): Promise<Date | null> {
  const { data } = await db
    .from(table)
    .select("period_end")
    .eq("provider_id", providerId)
    .eq("status", "active")
    .gt("period_end", now.toISOString())
    .order("period_end", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.period_end ? new Date(data.period_end) : null;
}

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Écritures du journal liées au cycle de vie d'une commande, et compteurs du prestataire.
 * Le journal est en ajout seul (trigger en base) : on n'écrit ici que des insertions.
 * Ces écritures ne mouvent aucun argent : elles reflètent des étapes déjà réalisées.
 */

/** Fonds confirmés chez le partenaire agréé. */
export async function recordFunding(db: SupabaseClient, order: { id: string; amount_minor: number | string; currency: string }) {
  const { error } = await db.from("ledger_entries").insert({
    order_id: order.id,
    kind: "order_funded",
    direction: "credit",
    amount_minor: String(order.amount_minor),
    currency: order.currency,
    external_ref: `funded:${order.id}`,
  });
  if (error) console.error("recordFunding:", error.message);
}

/** Commande terminée : commission prélevée et mission comptée pour le prestataire. */
export async function recordCompletion(db: SupabaseClient, orderId: string, providerId: string) {
  const { data: order } = await db.from("orders").select("commission_minor, currency").eq("id", orderId).maybeSingle();
  if (order) {
    const { error } = await db.from("ledger_entries").insert({
      order_id: orderId,
      kind: "commission",
      direction: "credit",
      amount_minor: String(order.commission_minor),
      currency: order.currency,
      external_ref: `commission:${orderId}`,
    });
    if (error) console.error("recordCompletion ledger:", error.message);
  }

  const { data: profile } = await db.from("provider_profiles").select("completed_orders").eq("profile_id", providerId).maybeSingle();
  const { error } = await db
    .from("provider_profiles")
    .update({ completed_orders: (profile?.completed_orders ?? 0) + 1 })
    .eq("profile_id", providerId);
  if (error) console.error("recordCompletion counter:", error.message);
}

/** Note moyenne et nombre d'avis du prestataire, recalculés à partir de la table des avis. */
export async function refreshProviderRating(db: SupabaseClient, providerId: string) {
  const { data: rows } = await db.from("reviews").select("rating").eq("target_id", providerId);
  const ratings = (rows ?? []).map((r) => Number(r.rating));
  const count = ratings.length;
  const avg = count ? ratings.reduce((s, n) => s + n, 0) / count : null;
  const { error } = await db
    .from("provider_profiles")
    .update({ rating_avg: avg === null ? null : avg.toFixed(2), rating_count: count })
    .eq("profile_id", providerId);
  if (error) console.error("refreshProviderRating:", error.message);
}

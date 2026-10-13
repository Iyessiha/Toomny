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

  const { error } = await db.rpc("increment_completed_orders", { provider_id: providerId });
  if (error) console.error("recordCompletion counter:", error.message);
}

/**
 * Versement effectué au prestataire (file manuelle, marqué payé par l'admin).
 * Sortie vue plateforme : direction `debit`. La référence opérateur, quand
 * l'admin la renseigne, permet de recouper avec le relevé mobile money.
 */
export async function recordPayout(
  db: SupabaseClient,
  payout: {
    orderId: string;
    providerId: string;
    amountMinor: number | string | bigint;
    currency: string;
    providerRef?: string | null;
  },
) {
  const { error } = await db.from("ledger_entries").insert({
    order_id: payout.orderId,
    profile_id: payout.providerId,
    kind: "payout",
    direction: "debit",
    amount_minor: String(payout.amountMinor),
    currency: payout.currency,
    external_ref: payout.providerRef ?? `payout:${payout.orderId}`,
  });
  if (error) console.error("recordPayout:", error.message);
}

/** Fonds rendus au client (litige tranché en sa faveur). Sortie : `debit`. */
export async function recordRefund(
  db: SupabaseClient,
  refund: { orderId: string; profileId?: string; amountMinor: number | string | bigint; currency: string },
) {
  const { error } = await db.from("ledger_entries").insert({
    order_id: refund.orderId,
    profile_id: refund.profileId ?? null,
    kind: "refund",
    direction: "debit",
    amount_minor: String(refund.amountMinor),
    currency: refund.currency,
    external_ref: `refund:${refund.orderId}`,
  });
  if (error) console.error("recordRefund:", error.message);
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

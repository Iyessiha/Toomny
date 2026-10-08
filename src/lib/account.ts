import type { SupabaseClient } from "@supabase/supabase-js";

/** Commandes encore liées à de l'argent ou à une décision : bloquent la suppression. */
const BLOCKING_ORDER_STATUSES = ["pending_payment", "funded", "in_progress", "delivered", "disputed"];

export type DeletionResult = { ok: true } | { ok: false; reason: "active" | "failed" };

/** Anonymise les données personnelles et bannit le compte côté Auth. */
export function anonymizedEmail(userId: string): string {
  return `supprime+${userId}@invalid.toomny`;
}

/**
 * Suppression de compte. On n'efface pas la ligne `profiles` : les commandes, le
 * journal comptable et les litiges la référencent (RESTRICT), et leur conservation
 * est une obligation. On efface en revanche tout ce qui identifie la personne.
 */
export async function deleteAccount(db: SupabaseClient, userId: string): Promise<DeletionResult> {
  const { data: openOrders, error: ordersErr } = await db
    .from("orders")
    .select("id")
    .or(`client_id.eq.${userId},provider_id.eq.${userId}`)
    .in("status", BLOCKING_ORDER_STATUSES)
    .limit(1);
  if (ordersErr) return fail("orders", ordersErr.message);
  if (openOrders && openOrders.length > 0) return { ok: false, reason: "active" };

  const { data: openPayouts, error: payoutsErr } = await db
    .from("payouts")
    .select("id")
    .eq("provider_id", userId)
    .in("status", ["queued", "processing"])
    .limit(1);
  if (payoutsErr) return fail("payouts", payoutsErr.message);
  if (openPayouts && openPayouts.length > 0) return { ok: false, reason: "active" };

  // Pièces d'identité : fichiers puis lignes de vérification.
  const { data: files } = await db.storage.from("kyc-documents").list(userId, { limit: 100 });
  if (files && files.length > 0) {
    const { error } = await db.storage
      .from("kyc-documents")
      .remove(files.map((f) => `${userId}/${f.name}`));
    if (error) return fail("kyc-files", error.message);
  }
  const { error: kycErr } = await db.from("verifications").delete().eq("profile_id", userId);
  if (kycErr) return fail("verifications", kycErr.message);

  // Fiche prestataire et prestations : retirées de la vitrine.
  const { error: ppErr } = await db
    .from("provider_profiles")
    .update({ headline: null, bio: null, city: null, payout_msisdn: null })
    .eq("profile_id", userId);
  if (ppErr) return fail("provider_profiles", ppErr.message);
  const { error: svcErr } = await db.from("services").update({ status: "removed" }).eq("provider_id", userId);
  if (svcErr) return fail("services", svcErr.message);

  const now = new Date().toISOString();
  const { error: profErr } = await db
    .from("profiles")
    .update({
      email: anonymizedEmail(userId),
      display_name: null,
      first_name: null,
      last_name: null,
      phone: null,
      city: null,
      updated_at: now,
    })
    .eq("id", userId);
  if (profErr) return fail("profiles", profErr.message);

  // Plus de connexion possible : le compte est banni et son e-mail effacé côté Auth.
  const { error: authErr } = await db.auth.admin.updateUserById(userId, {
    email: anonymizedEmail(userId),
    ban_duration: "876000h",
  });
  if (authErr) return fail("auth", authErr.message);

  return { ok: true };
}

function fail(step: string, message: string): DeletionResult {
  console.error(`deleteAccount (${step}):`, message);
  return { ok: false, reason: "failed" };
}

"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, isProvider } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPayoutTexts } from "@/i18n/payouts";

const CHANNELS = ["wave", "orange_money", "mtn_momo", "moov_money", "bank_transfer"] as const;

/** Canal et numéro de versement du prestataire. La RLS limite l'écriture à sa propre fiche. */
export async function savePayoutSettings(formData: FormData) {
  const user = await requireAuth();
  const t = getPayoutTexts(user.preferredLocale).errors;
  if (!isProvider(user.role)) return { error: t.notProvider };

  const channel = String(formData.get("channel") ?? "");
  const msisdn = String(formData.get("msisdn") ?? "").replace(/[\s.-]/g, "");

  if (!(CHANNELS as readonly string[]).includes(channel)) return { error: t.channel };
  if (!/^\+?[0-9]{8,15}$/.test(msisdn)) return { error: t.number };

  const supabase = await createClient();
  const { error } = await supabase
    .from("provider_profiles")
    .update({ payout_channel: channel, payout_msisdn: msisdn })
    .eq("profile_id", user.id);
  if (error) return { error: t.save };

  revalidatePath("/dashboard/versements");
  return { success: true };
}

/**
 * Créer des lignes de versement (status=queued) pour chaque commande complétée
 * qui n'a pas encore de versement actif (queued/processing/paid).
 * Utilise le client admin car la RLS n'autorise pas INSERT pour les prestataires.
 */
export async function requestPayout() {
  const user = await requireAuth();
  const t = getPayoutTexts(user.preferredLocale);
  if (!isProvider(user.role)) return { error: t.errors.notProvider };

  const supabase = await createClient();

  // 1. Récupérer le canal configuré
  const { data: profile } = await supabase
    .from("provider_profiles")
    .select("payout_channel, payout_msisdn")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!profile?.payout_channel || !profile?.payout_msisdn) {
    return { error: t.noChannel };
  }

  // 2. Commandes complétées de ce prestataire
  const { data: completedOrders } = await supabase
    .from("orders")
    .select("id, provider_net_minor, currency")
    .eq("provider_id", user.id)
    .eq("status", "completed");

  if (!completedOrders || completedOrders.length === 0) {
    return { error: t.nothingAvailable };
  }

  // 3. Versements déjà actifs (pas échoués)
  const { data: existingPayouts } = await supabase
    .from("payouts")
    .select("order_id")
    .eq("provider_id", user.id)
    .in("status", ["queued", "processing", "paid"]);

  const paidOrderIds = new Set((existingPayouts ?? []).map((p) => p.order_id));

  const eligibleOrders = completedOrders.filter(
    (o) => !paidOrderIds.has(o.id) && BigInt(o.provider_net_minor) > 0n
  );

  if (eligibleOrders.length === 0) return { error: t.nothingAvailable };

  // 4. Insérer les lignes (admin client pour bypasser la RLS)
  const db = createAdminClient();
  const rows = eligibleOrders.map((o) => ({
    order_id: o.id,
    provider_id: user.id,
    channel: profile.payout_channel as string,
    msisdn: profile.payout_msisdn as string,
    amount_minor: String(o.provider_net_minor),
    currency: o.currency,
    status: "queued" as const,
  }));

  const { error } = await db.from("payouts").insert(rows);
  if (error) {
    // 23505 : une demande concurrente a déjà créé ce versement (voir migration 0034).
    if (error.code === "23505") return { error: t.errors.alreadyRequested };
    console.error("requestPayout:", error.message);
    return { error: t.errors.request };
  }

  revalidatePath("/dashboard/versements");
  return { success: true, count: rows.length };
}

"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, isProvider } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
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

"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, isProvider } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { toMinor } from "@/lib/money";
import { getDashboardTexts } from "@/i18n/dashboard";

/**
 * Créer une prestation en brouillon. Seul un prestataire peut le faire (RLS :
 * services_owner_insert exige le rôle provider et le statut draft). La
 * publication passe ensuite par la modération, côté serveur.
 */
export async function createService(formData: FormData) {
  const user = await requireAuth();
  const e = getDashboardTexts(user.preferredLocale).services.errors;
  if (!isProvider(user.role)) return { error: e.notProvider };

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "");
  const priceRaw = String(formData.get("price") ?? "").trim();
  const deliveryDays = Number(formData.get("deliveryDays"));

  if (!title || title.length > 120) return { error: e.title };
  if (description.length < 30 || description.length > 3000) {
    return { error: e.description };
  }
  if (!categoryId) return { error: e.category };
  if (!Number.isInteger(deliveryDays) || deliveryDays < 1 || deliveryDays > 365) {
    return { error: e.deliveryRange };
  }

  let priceMinor: bigint;
  try {
    priceMinor = toMinor(priceRaw, "XOF");
  } catch {
    return { error: e.price };
  }
  if (priceMinor < 1000n || priceMinor > 10_000_000n) {
    return { error: e.priceRange };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("services").insert({
    provider_id: user.id,
    category_id: categoryId,
    title,
    description,
    price_minor: priceMinor.toString(),
    currency: "XOF",
    delivery_days: deliveryDays,
    content_locale: "fr",
    status: "draft",
  });
  if (error) return { error: e.save };

  revalidatePath("/dashboard/prestations");
  return { success: true };
}

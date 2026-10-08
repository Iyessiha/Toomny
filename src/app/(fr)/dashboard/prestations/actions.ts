"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, isProvider } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { toMinor } from "@/lib/money";

/**
 * Créer une prestation en brouillon. Seul un prestataire peut le faire (RLS :
 * services_owner_insert exige le rôle provider et le statut draft). La
 * publication passe ensuite par la modération, côté serveur.
 */
export async function createService(formData: FormData) {
  const user = await requireAuth();
  if (!isProvider(user.role)) return { error: "Réservé aux comptes prestataires." };

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "");
  const priceRaw = String(formData.get("price") ?? "").trim();
  const deliveryDays = Number(formData.get("deliveryDays"));

  if (!title || title.length > 120) return { error: "Titre requis (120 caractères maximum)." };
  if (description.length < 30 || description.length > 3000) {
    return { error: "Description : entre 30 et 3000 caractères." };
  }
  if (!categoryId) return { error: "Choisissez une catégorie." };
  if (!Number.isInteger(deliveryDays) || deliveryDays < 1 || deliveryDays > 365) {
    return { error: "Délai de livraison : entre 1 et 365 jours." };
  }

  let priceMinor: bigint;
  try {
    priceMinor = toMinor(priceRaw, "XOF");
  } catch {
    return { error: "Prix invalide : entier en FCFA." };
  }
  if (priceMinor < 1000n || priceMinor > 10_000_000n) {
    return { error: "Prix : entre 1 000 et 10 000 000 FCFA." };
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
  if (error) return { error: "La prestation n'a pas pu être enregistrée." };

  revalidatePath("/dashboard/prestations");
  return { success: true };
}

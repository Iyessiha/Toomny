"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, isProvider } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const CONTENT_LOCALES = ["fr", "en"] as const;

/** Profil public du prestataire. La RLS limite l'écriture à sa propre fiche. */
export async function saveProviderProfile(formData: FormData) {
  const user = await requireAuth();
  if (!isProvider(user.role)) return { error: "Réservé aux comptes prestataires." };

  const headline = String(formData.get("headline") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const locale = String(formData.get("contentLocale") ?? "fr");

  if (headline.length > 120) return { error: "Titre : 120 caractères maximum." };
  if (bio.length > 2000) return { error: "Présentation : 2000 caractères maximum." };
  if (city.length > 80) return { error: "Ville : 80 caractères maximum." };
  if (!(CONTENT_LOCALES as readonly string[]).includes(locale)) return { error: "Langue inconnue." };

  const supabase = await createClient();
  const { error } = await supabase.from("provider_profiles").upsert(
    {
      profile_id: user.id,
      headline: headline || null,
      bio: bio || null,
      city: city || null,
      content_locale: locale,
    },
    { onConflict: "profile_id" },
  );
  if (error) return { error: "Le profil n'a pas pu être enregistré." };

  revalidatePath(`/prestataires/${user.id}`);
  revalidatePath("/dashboard/profil");
  return { success: true };
}

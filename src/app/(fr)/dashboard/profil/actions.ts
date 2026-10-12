"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, isProvider } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getDashboardTexts } from "@/i18n/dashboard";

const CONTENT_LOCALES = ["fr", "en"] as const;

/** Vérifie qu'une valeur est une URL https:// valide ou vide. */
function isValidHttpsUrl(value: string): boolean {
  if (!value) return true;
  try {
    const u = new URL(value);
    return u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Profil public du prestataire. La RLS limite l'écriture à sa propre fiche. */
export async function saveProviderProfile(formData: FormData) {
  const user = await requireAuth();
  const e = getDashboardTexts(user.preferredLocale).profile.errors;
  if (!isProvider(user.role)) return { error: e.notProvider };

  const headline = String(formData.get("headline") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const locale = String(formData.get("contentLocale") ?? "fr");
  const avatarUrl = String(formData.get("avatarUrl") ?? "").trim() || null;
  const skills = String(formData.get("skills") ?? "").trim();
  const spokenLanguages = String(formData.get("spokenLanguages") ?? "").trim();
  const websiteUrl = String(formData.get("websiteUrl") ?? "").trim();
  const linkedinUrl = String(formData.get("linkedinUrl") ?? "").trim();
  const twitterUrl = String(formData.get("twitterUrl") ?? "").trim();

  if (headline.length > 120) return { error: e.headline };
  if (bio.length > 2000) return { error: e.bio };
  if (city.length > 80) return { error: e.city };
  if (!(CONTENT_LOCALES as readonly string[]).includes(locale)) return { error: e.locale };
  if (skills.length > 500) return { error: e.skills };
  if (spokenLanguages.length > 200) return { error: e.spokenLanguages };
  if (!isValidHttpsUrl(websiteUrl)) return { error: e.websiteUrl };
  if (!isValidHttpsUrl(linkedinUrl)) return { error: e.linkedinUrl };
  if (!isValidHttpsUrl(twitterUrl)) return { error: e.twitterUrl };

  const supabase = await createClient();
  const { error } = await supabase.from("provider_profiles").upsert(
    {
      profile_id: user.id,
      headline: headline || null,
      bio: bio || null,
      city: city || null,
      content_locale: locale,
      avatar_url: avatarUrl,
      skills: skills || null,
      spoken_languages: spokenLanguages || null,
      website_url: websiteUrl || null,
      linkedin_url: linkedinUrl || null,
      twitter_url: twitterUrl || null,
    },
    { onConflict: "profile_id" },
  );
  if (error) return { error: e.save };

  revalidatePath(`/prestataires/${user.id}`);
  revalidatePath("/dashboard/profil");
  return { success: true };
}

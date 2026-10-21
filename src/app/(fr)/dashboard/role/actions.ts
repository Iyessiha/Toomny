"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Changements de rôle depuis le tableau de bord. Le seul résultat possible est « both »
 * (prestataire et recruteur) : jamais de rétrogradation, jamais d'« admin ».
 * La colonne role n'est pas modifiable par l'utilisateur (voir les grants) : l'écriture
 * passe par la clé de service, avec une condition sur le rôle actuel.
 */

const MSG = {
  fr: {
    notAllowed: "Ce changement n'est pas disponible pour votre compte.",
    headline: "Indiquez le titre de votre activité (120 caractères max).",
    city: "La ville est trop longue (80 caractères max).",
    skills: "La liste des compétences est trop longue (500 caractères max).",
    save: "L'enregistrement a échoué. Réessayez.",
  },
  en: {
    notAllowed: "This change is not available for your account.",
    headline: "Enter the title of your activity (120 characters max).",
    city: "The city is too long (80 characters max).",
    skills: "The skills list is too long (500 characters max).",
    save: "Saving failed. Please try again.",
  },
} as const;

/** Un compte prestataire ajoute le rôle recruteur : il peut aussi commander des prestations. */
export async function addRecruiterRole(): Promise<{ success: true } | { error: string }> {
  const user = await requireAuth();
  const m = MSG[user.preferredLocale];
  if (user.role !== "provider") return { error: m.notAllowed };

  const { error } = await createAdminClient()
    .from("profiles")
    .update({ role: "both", updated_at: new Date().toISOString() })
    .eq("id", user.id)
    .eq("role", "provider");
  if (error) return { error: m.save };

  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Un compte client devient prestataire : fiche prestataire créée à partir du formulaire,
 * puis rôle « both ». L'identité reste à vérifier avant toute publication (KYC).
 */
export async function becomeProvider(formData: FormData): Promise<{ success: true } | { error: string }> {
  const user = await requireAuth();
  const m = MSG[user.preferredLocale];
  if (user.role !== "client") return { error: m.notAllowed };

  const headline = String(formData.get("headline") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const skills = String(formData.get("skills") ?? "").trim();

  if (!headline || headline.length > 120) return { error: m.headline };
  if (city.length > 80) return { error: m.city };
  if (skills.length > 500) return { error: m.skills };

  const supabase = await createClient();
  const { error: profileError } = await supabase.from("provider_profiles").upsert(
    {
      profile_id: user.id,
      headline,
      city: city || null,
      skills: skills || null,
      content_locale: user.preferredLocale,
    },
    { onConflict: "profile_id" },
  );
  if (profileError) return { error: m.save };

  const { error } = await createAdminClient()
    .from("profiles")
    .update({ role: "both", updated_at: new Date().toISOString() })
    .eq("id", user.id)
    .eq("role", "client");
  if (error) return { error: m.save };

  revalidatePath("/dashboard");
  return { success: true };
}

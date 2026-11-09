// Brouillon de profil prestataire : types, nettoyage de la sortie du modèle
// et fusion dans le formulaire. Ce module reste sans dépendance serveur : il
// est importé par des composants client.

export const PROFILE_LIMITS = { headline: 120, bio: 2000, city: 80, skills: 500, spokenLanguages: 200 } as const;

/** Champs du profil tels que le formulaire les manipule (chaînes, listes séparées par des virgules). */
export type ProfileFields = {
  headline: string;
  bio: string;
  city: string;
  skills: string;
  spokenLanguages: string;
};

export type ProfileDraft = {
  headline: string;
  bio: string;
  city: string;
  skills: string[];
  spokenLanguages: string[];
};

export const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

export function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function strings(value: unknown, maxItems: number, maxLength: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim().slice(0, maxLength))
    .filter((v) => v.length > 0)
    .slice(0, maxItems);
}

/** Valide la sortie du modèle pour le profil. Null si la forme est inutilisable. */
export function sanitizeProfileDraft(raw: unknown): ProfileDraft | null {
  if (!isObject(raw)) return null;
  const draft: ProfileDraft = {
    headline: text(raw.headline, PROFILE_LIMITS.headline),
    bio: text(raw.bio, PROFILE_LIMITS.bio),
    city: text(raw.city, PROFILE_LIMITS.city),
    skills: strings(raw.skills, 15, 40),
    spokenLanguages: strings(raw.spokenLanguages, 6, 20),
  };
  if (!draft.headline && !draft.bio) return null;
  return draft;
}

/**
 * Remplit uniquement les champs vides du profil : ce que le prestataire a déjà
 * écrit n'est jamais remplacé par l'assistant.
 */
export function mergeProfileDraft(current: ProfileFields, draft: ProfileDraft): ProfileFields {
  return {
    headline: current.headline.trim() ? current.headline : draft.headline,
    bio: current.bio.trim() ? current.bio : draft.bio,
    city: current.city.trim() ? current.city : draft.city,
    skills: current.skills.trim() ? current.skills : draft.skills.join(", "),
    spokenLanguages: current.spokenLanguages.trim() ? current.spokenLanguages : draft.spokenLanguages.join(", "),
  };
}

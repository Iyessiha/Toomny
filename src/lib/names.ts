import { createAdminClient } from "@/lib/supabase/admin";
import type { Locale } from "@/i18n/dictionaries";

export type DisplayName = {
  /** Nom complet d'affichage (espaces privés, entre cocontractants). */
  name: string;
  /** Version publique : pseudo, ou prénom + initiale du nom. */
  short: string;
  initials: string;
};

/**
 * Noms d'affichage d'une liste d'utilisateurs, pour les écrans de discussion.
 *
 * La RLS n'autorise chacun qu'à lire SA propre ligne `profiles` : les noms
 * des interlocuteurs (messages, avis, demandes) se résolvent donc côté
 * serveur, après authentification. Seules les colonnes de présentation sont
 * lues — jamais l'e-mail ni le téléphone.
 */
export async function resolveDisplayNames(ids: string[]): Promise<Map<string, DisplayName>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map();

  const db = createAdminClient();
  const { data } = await db
    .from("profiles")
    .select("id, display_name, first_name, last_name")
    .in("id", unique);

  const out = new Map<string, DisplayName>();
  for (const p of data ?? []) {
    const full = p.display_name ?? [p.first_name, p.last_name].filter(Boolean).join(" ");
    const short =
      p.display_name ??
      ((p.first_name ?? "") + (p.last_name ? ` ${p.last_name.charAt(0).toUpperCase()}.` : "")).trim();
    out.set(p.id as string, {
      name: full || "—",
      short: short || "—",
      initials: (p.display_name ?? p.first_name ?? "?").slice(0, 1).toUpperCase(),
    });
  }
  return out;
}

/**
 * Nom public d'un émetteur de notification (pseudo ou prénom + initiale),
 * avec repli neutre dans la langue du lecteur.
 */
export async function actorName(userId: string, locale: Locale): Promise<string> {
  try {
    const names = await resolveDisplayNames([userId]);
    return names.get(userId)?.short ?? (locale === "en" ? "A member" : "Un membre");
  } catch {
    return locale === "en" ? "A member" : "Un membre";
  }
}

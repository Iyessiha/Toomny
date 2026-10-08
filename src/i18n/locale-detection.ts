import type { Locale } from "./dictionaries";

/** Pays dont la langue d'usage est l'anglais : un visiteur de ces pays arrive sur /en. */
export const ENGLISH_COUNTRIES = new Set(["GH", "NG", "GB", "US", "CA", "IE", "ZA", "KE"]);

export const LOCALE_COOKIE = "toomny_locale";

/** Langue par défaut selon le pays détecté. Sans pays connu : français. */
export function localeForCountry(country: string | null | undefined): Locale {
  if (country && ENGLISH_COUNTRIES.has(country.toUpperCase())) return "en";
  return "fr";
}

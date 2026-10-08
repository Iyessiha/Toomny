import { cookies } from "next/headers";
import { LOCALE_COOKIE } from "./locale-detection";
import type { Locale } from "./dictionaries";

/** Langue du visiteur pour les pages publiques (sans profil) : cookie posé par le proxy. */
export async function visitorLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return value === "en" ? "en" : "fr";
}

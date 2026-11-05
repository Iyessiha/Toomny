import type { Locale } from "@/i18n/dictionaries";

/** Date de paiement lisible, en heure d'Abidjan (fuseau de Toomny). */
export function formatReceiptDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Africa/Abidjan",
  }).format(date);
}

/** Échappe le texte saisi par les utilisateurs avant de l'insérer dans un e-mail HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

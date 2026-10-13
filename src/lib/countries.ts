/**
 * Liste des pays avec drapeau emoji, indicatif téléphonique et noms FR/EN.
 * Priorité : Afrique de l'Ouest (marché principal Toomny) → reste Afrique → monde.
 */

export type Country = {
  code: string;     // ISO 3166-1 alpha-2
  flag: string;     // emoji drapeau
  dialCode: string; // indicatif ex. "+225"
  fr: string;       // nom français
  en: string;       // nom anglais
};

export const COUNTRIES: Country[] = [
  // ── Afrique de l'Ouest (UEMOA + proches) ──────────────────────────────────
  { code: "CI", flag: "🇨🇮", dialCode: "+225", fr: "Côte d'Ivoire",      en: "Côte d'Ivoire" },
  { code: "SN", flag: "🇸🇳", dialCode: "+221", fr: "Sénégal",             en: "Senegal" },
  { code: "ML", flag: "🇲🇱", dialCode: "+223", fr: "Mali",                en: "Mali" },
  { code: "BF", flag: "🇧🇫", dialCode: "+226", fr: "Burkina Faso",        en: "Burkina Faso" },
  { code: "GN", flag: "🇬🇳", dialCode: "+224", fr: "Guinée",              en: "Guinea" },
  { code: "TG", flag: "🇹🇬", dialCode: "+228", fr: "Togo",                en: "Togo" },
  { code: "BJ", flag: "🇧🇯", dialCode: "+229", fr: "Bénin",               en: "Benin" },
  { code: "NE", flag: "🇳🇪", dialCode: "+227", fr: "Niger",               en: "Niger" },
  { code: "GW", flag: "🇬🇼", dialCode: "+245", fr: "Guinée-Bissau",       en: "Guinea-Bissau" },
  { code: "NG", flag: "🇳🇬", dialCode: "+234", fr: "Nigeria",             en: "Nigeria" },
  { code: "GH", flag: "🇬🇭", dialCode: "+233", fr: "Ghana",               en: "Ghana" },
  { code: "LR", flag: "🇱🇷", dialCode: "+231", fr: "Liberia",             en: "Liberia" },
  { code: "SL", flag: "🇸🇱", dialCode: "+232", fr: "Sierra Leone",        en: "Sierra Leone" },
  { code: "GM", flag: "🇬🇲", dialCode: "+220", fr: "Gambie",              en: "Gambia" },
  { code: "CV", flag: "🇨🇻", dialCode: "+238", fr: "Cap-Vert",            en: "Cape Verde" },
  { code: "MR", flag: "🇲🇷", dialCode: "+222", fr: "Mauritanie",          en: "Mauritania" },

  // ── Afrique Centrale ───────────────────────────────────────────────────────
  { code: "CM", flag: "🇨🇲", dialCode: "+237", fr: "Cameroun",            en: "Cameroon" },
  { code: "CD", flag: "🇨🇩", dialCode: "+243", fr: "RD Congo",            en: "DR Congo" },
  { code: "CG", flag: "🇨🇬", dialCode: "+242", fr: "Congo-Brazzaville",   en: "Congo" },
  { code: "GA", flag: "🇬🇦", dialCode: "+241", fr: "Gabon",               en: "Gabon" },
  { code: "CF", flag: "🇨🇫", dialCode: "+236", fr: "Centrafrique",        en: "Central African Republic" },
  { code: "TD", flag: "🇹🇩", dialCode: "+235", fr: "Tchad",               en: "Chad" },
  { code: "GQ", flag: "🇬🇶", dialCode: "+240", fr: "Guinée équatoriale",  en: "Equatorial Guinea" },
  { code: "ST", flag: "🇸🇹", dialCode: "+239", fr: "São Tomé-et-Príncipe",en: "São Tomé and Príncipe" },

  // ── Afrique de l'Est ───────────────────────────────────────────────────────
  { code: "ET", flag: "🇪🇹", dialCode: "+251", fr: "Éthiopie",            en: "Ethiopia" },
  { code: "KE", flag: "🇰🇪", dialCode: "+254", fr: "Kenya",               en: "Kenya" },
  { code: "TZ", flag: "🇹🇿", dialCode: "+255", fr: "Tanzanie",            en: "Tanzania" },
  { code: "UG", flag: "🇺🇬", dialCode: "+256", fr: "Ouganda",             en: "Uganda" },
  { code: "RW", flag: "🇷🇼", dialCode: "+250", fr: "Rwanda",              en: "Rwanda" },
  { code: "MG", flag: "🇲🇬", dialCode: "+261", fr: "Madagascar",          en: "Madagascar" },
  { code: "MZ", flag: "🇲🇿", dialCode: "+258", fr: "Mozambique",          en: "Mozambique" },

  // ── Afrique du Nord ───────────────────────────────────────────────────────
  { code: "MA", flag: "🇲🇦", dialCode: "+212", fr: "Maroc",               en: "Morocco" },
  { code: "DZ", flag: "🇩🇿", dialCode: "+213", fr: "Algérie",             en: "Algeria" },
  { code: "TN", flag: "🇹🇳", dialCode: "+216", fr: "Tunisie",             en: "Tunisia" },
  { code: "EG", flag: "🇪🇬", dialCode: "+20",  fr: "Égypte",              en: "Egypt" },

  // ── Afrique du Sud ────────────────────────────────────────────────────────
  { code: "ZA", flag: "🇿🇦", dialCode: "+27",  fr: "Afrique du Sud",      en: "South Africa" },

  // ── Europe (diaspora) ─────────────────────────────────────────────────────
  { code: "FR", flag: "🇫🇷", dialCode: "+33",  fr: "France",              en: "France" },
  { code: "BE", flag: "🇧🇪", dialCode: "+32",  fr: "Belgique",            en: "Belgium" },
  { code: "CH", flag: "🇨🇭", dialCode: "+41",  fr: "Suisse",              en: "Switzerland" },
  { code: "LU", flag: "🇱🇺", dialCode: "+352", fr: "Luxembourg",          en: "Luxembourg" },
  { code: "GB", flag: "🇬🇧", dialCode: "+44",  fr: "Royaume-Uni",         en: "United Kingdom" },
  { code: "DE", flag: "🇩🇪", dialCode: "+49",  fr: "Allemagne",           en: "Germany" },
  { code: "ES", flag: "🇪🇸", dialCode: "+34",  fr: "Espagne",             en: "Spain" },
  { code: "IT", flag: "🇮🇹", dialCode: "+39",  fr: "Italie",              en: "Italy" },
  { code: "PT", flag: "🇵🇹", dialCode: "+351", fr: "Portugal",            en: "Portugal" },
  { code: "NL", flag: "🇳🇱", dialCode: "+31",  fr: "Pays-Bas",            en: "Netherlands" },
  { code: "SE", flag: "🇸🇪", dialCode: "+46",  fr: "Suède",               en: "Sweden" },
  { code: "NO", flag: "🇳🇴", dialCode: "+47",  fr: "Norvège",             en: "Norway" },
  { code: "DK", flag: "🇩🇰", dialCode: "+45",  fr: "Danemark",            en: "Denmark" },
  { code: "FI", flag: "🇫🇮", dialCode: "+358", fr: "Finlande",            en: "Finland" },
  { code: "IE", flag: "🇮🇪", dialCode: "+353", fr: "Irlande",             en: "Ireland" },
  { code: "PL", flag: "🇵🇱", dialCode: "+48",  fr: "Pologne",             en: "Poland" },

  // ── Amériques (diaspora) ──────────────────────────────────────────────────
  { code: "US", flag: "🇺🇸", dialCode: "+1",   fr: "États-Unis",          en: "United States" },
  { code: "CA", flag: "🇨🇦", dialCode: "+1",   fr: "Canada",              en: "Canada" },
  { code: "BR", flag: "🇧🇷", dialCode: "+55",  fr: "Brésil",              en: "Brazil" },
  { code: "HT", flag: "🇭🇹", dialCode: "+509", fr: "Haïti",               en: "Haiti" },

  // ── Moyen-Orient / Asie ───────────────────────────────────────────────────
  { code: "AE", flag: "🇦🇪", dialCode: "+971", fr: "Émirats arabes unis", en: "United Arab Emirates" },
  { code: "SA", flag: "🇸🇦", dialCode: "+966", fr: "Arabie saoudite",     en: "Saudi Arabia" },
  { code: "CN", flag: "🇨🇳", dialCode: "+86",  fr: "Chine",               en: "China" },
  { code: "IN", flag: "🇮🇳", dialCode: "+91",  fr: "Inde",                en: "India" },
];

/** Trouve un pays par son code ISO. */
export function getCountry(code: string): Country | undefined {
  return COUNTRIES.find((c) => c.code === code);
}

/** Pour les selects : affiche "🇨🇮 +225 Côte d'Ivoire" */
export function countryLabel(c: Country, locale: "fr" | "en" = "fr"): string {
  return `${c.flag} ${c.dialCode} ${locale === "fr" ? c.fr : c.en}`;
}

/** Pays de l'UEMOA + proches pour la liste KYC (remplacement de kyc.ts) */
export const KYC_ELIGIBLE_CODES = new Set([
  "CI","SN","ML","BF","GN","TG","BJ","NE","GW","CM","NG","GH",
]);

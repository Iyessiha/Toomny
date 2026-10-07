// ---------------------------------------------------------------------------
// Argent — entiers uniquement, jamais de flottant.
//
// Tout montant circule en unité mineure (`minor`). Le XOF n'a pas de
// subdivision : 1 FCFA = 1 unité mineure, exponent 0. L'USD en a 2.
// Se tromper d'exponent sur le XOF multiplie les montants par 100 : c'est le
// bug le plus coûteux possible ici, d'où le tableau explicite ci-dessous.
// ---------------------------------------------------------------------------

export const CURRENCIES = {
  XOF: { exponent: 0, symbol: "FCFA", label: { fr: "Franc CFA", en: "CFA franc" } },
  GHS: { exponent: 2, symbol: "₵", label: { fr: "Cedi ghanéen", en: "Ghanaian cedi" } },
  NGN: { exponent: 2, symbol: "₦", label: { fr: "Naira nigérian", en: "Nigerian naira" } },
  USD: { exponent: 2, symbol: "$", label: { fr: "Dollar américain", en: "US dollar" } },
  EUR: { exponent: 2, symbol: "€", label: { fr: "Euro", en: "Euro" } },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export const DEFAULT_CURRENCY: CurrencyCode = "XOF";

export function isSupportedCurrency(code: string): code is CurrencyCode {
  return code in CURRENCIES;
}

function currencyOrThrow(code: string) {
  if (!isSupportedCurrency(code)) {
    throw new Error(`Devise non prise en charge : ${code}`);
  }
  return CURRENCIES[code];
}

/** Convertit une saisie utilisateur ("1 500", "12.50") en unité mineure. */
export function toMinor(input: string | number, currency: string): bigint {
  const { exponent } = currencyOrThrow(currency);
  const raw = String(input).replace(/\s| /g, "").replace(",", ".");

  if (!/^-?\d+(\.\d+)?$/.test(raw)) {
    throw new Error(`Montant invalide : ${input}`);
  }

  const negative = raw.startsWith("-");
  const [whole, frac = ""] = raw.replace("-", "").split(".");

  if (frac.length > exponent) {
    throw new Error(`${currency} n'accepte pas plus de ${exponent} décimale(s).`);
  }

  const padded = frac.padEnd(exponent, "0");
  const value = BigInt(whole + padded);
  return negative ? -value : value;
}

/** Formate une unité mineure pour l'affichage, selon la locale. */
export function formatMoney(minor: bigint, currency: string, locale: "fr" | "en" = "fr"): string {
  const { exponent } = currencyOrThrow(currency);
  const divisor = 10 ** exponent;
  const value = Number(minor) / divisor;

  return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: exponent,
    maximumFractionDigits: exponent,
  }).format(value);
}

// --- Commission -------------------------------------------------------------

/** 10 % côté prestataire, 0 % côté client au lancement. 1000 bps = 10 %. */
export const DEFAULT_COMMISSION_BPS = 1000;

export type OrderAmounts = {
  amountMinor: bigint;
  commissionMinor: bigint;
  providerNetMinor: bigint;
  commissionRateBps: number;
};

/**
 * Répartit un montant de commande. L'arrondi se fait TOUJOURS au détriment de
 * la plateforme, jamais du prestataire : le net prestataire est le reste exact,
 * si bien que commission + net == montant, sans centime perdu.
 */
export function splitOrderAmount(
  amountMinor: bigint,
  commissionRateBps: number = DEFAULT_COMMISSION_BPS,
): OrderAmounts {
  if (amountMinor <= 0n) throw new Error("Le montant doit être strictement positif.");
  if (commissionRateBps < 0 || commissionRateBps > 10_000) {
    throw new Error("Le taux de commission doit être entre 0 et 10000 bps.");
  }

  const commissionMinor = (amountMinor * BigInt(commissionRateBps)) / 10_000n;

  return {
    amountMinor,
    commissionMinor,
    providerNetMinor: amountMinor - commissionMinor,
    commissionRateBps,
  };
}

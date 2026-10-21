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
  const tag = locale === "fr" ? "fr-FR" : "en-US";

  // Le CFA s'écrit après le montant : « 350 000 FCFA ».
  if (currency === "XOF") {
    return `${new Intl.NumberFormat(tag, { maximumFractionDigits: 0 }).format(value)} FCFA`;
  }

  return new Intl.NumberFormat(tag, {
    style: "currency",
    currency,
    minimumFractionDigits: exponent,
    maximumFractionDigits: exponent,
  }).format(value);
}

// --- Commission & frais GeniusPay -------------------------------------------

/** 10 % côté prestataire, 0 % côté client au lancement. 1000 bps = 10 %. */
export const DEFAULT_COMMISSION_BPS = 1000;

/**
 * Frais GeniusPay — collecte (paiement entrant).
 * Base : Wave CI (méthode la moins chère) = 2,5 % + 100 XOF fixe.
 * Ces frais sont ajoutés au prix du service et mis à la charge du CLIENT.
 */
export const GP_COLLECT_BPS = 250;       // 2,5 %
export const GP_COLLECT_FIXED = 100n;    // 100 XOF fixe par transaction

/**
 * Frais GeniusPay — virement sortant (payout prestataire).
 * Wave / Orange Money CI : ~1 %. Mis à la charge du PRESTATAIRE.
 */
export const GP_PAYOUT_BPS = 100;        // 1 %

export type OrderAmounts = {
  /** Prix du service (base, convenu entre les deux parties). */
  amountMinor: bigint;
  /** Frais GeniusPay collect → charge CLIENT (ajoutés au prix). */
  collectFeeMinor: bigint;
  /** Total facturé au client = amountMinor + collectFeeMinor. */
  clientChargeMinor: bigint;
  /** Commission Toomny → charge PRESTATAIRE (prélevée sur amountMinor). */
  commissionMinor: bigint;
  /** Frais GeniusPay payout → charge PRESTATAIRE (prélevés sur le net). */
  payoutFeeMinor: bigint;
  /** Net prestataire = amountMinor − commissionMinor − payoutFeeMinor. */
  providerNetMinor: bigint;
  commissionRateBps: number;
};

/**
 * Répartit un montant de commande selon le modèle économique Toomny :
 *   • Le CLIENT paie le prix du service + les frais GeniusPay collect.
 *   • Le PRESTATAIRE supporte la commission Toomny + les frais GeniusPay payout.
 *
 * Les arrondis favorisent toujours le prestataire : commission et frais sont
 * tronqués (arrondi vers le bas), le net est le reste exact.
 */
export function splitOrderAmount(
  amountMinor: bigint,
  commissionRateBps: number = DEFAULT_COMMISSION_BPS,
): OrderAmounts {
  if (amountMinor <= 0n) throw new Error("Le montant doit être strictement positif.");
  if (commissionRateBps < 0 || commissionRateBps > 10_000) {
    throw new Error("Le taux de commission doit être entre 0 et 10000 bps.");
  }

  // Frais collect : 2,5 % + 100 XOF (arrondi vers le bas → client paie le minimum)
  const collectFeeMinor = (amountMinor * BigInt(GP_COLLECT_BPS)) / 10_000n + GP_COLLECT_FIXED;
  const clientChargeMinor = amountMinor + collectFeeMinor;

  // Commission Toomny (arrondi vers le bas → net prestataire jamais lésé)
  const commissionMinor = (amountMinor * BigInt(commissionRateBps)) / 10_000n;

  // Frais payout : 1 % du net avant payout (arrondi vers le bas)
  const netBeforePayout = amountMinor - commissionMinor;
  const payoutFeeMinor = (netBeforePayout * BigInt(GP_PAYOUT_BPS)) / 10_000n;

  return {
    amountMinor,
    collectFeeMinor,
    clientChargeMinor,
    commissionMinor,
    payoutFeeMinor,
    providerNetMinor: netBeforePayout - payoutFeeMinor,
    commissionRateBps,
  };
}

// ---------------------------------------------------------------------------
// Dictionnaires FR / EN.
//
// Le français est la langue de lancement, l'anglais est prêt dès la première
// version : l'ouverture du marché anglophone est la phase 2 du plan, et
// rétrofiter une i18n coûte plusieurs semaines.
//
// Règle : AUCUNE chaîne de texte en dur dans un composant. Toute clé manquante
// en anglais doit apparaître ici, pas être oubliée dans le code.
// ---------------------------------------------------------------------------

export const LOCALES = ["fr", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export const dictionaries = {
  fr: {
    brand: {
      name: "Toomny",
      tagline: "Travailler ensemble, grandir ensemble.",
    },
    nav: {
      browse: "Parcourir",
      howItWorks: "Comment ça marche",
      becomeProvider: "Proposer mes services",
      login: "Se connecter",
      signup: "Créer un compte",
      dashboard: "Tableau de bord",
      orders: "Commandes",
      messages: "Messages",
    },
    promise: {
      provider: "Payé sur ton mobile money après validation.",
      client: "Ton paiement est conservé jusqu'à la livraison.",
      commission: "Tu gardes entre 90 % et 97 % de ce que tu factures.",
    },
    order: {
      status: {
        pending_payment: "En attente de paiement",
        funded: "Paiement conservé",
        in_progress: "En cours",
        delivered: "Livré",
        completed: "Terminé",
        disputed: "Litige",
        cancelled: "Annulé",
        refunded: "Remboursé",
      },
      deliveryIn: "Livraison en {days} jour(s)",
      escrowNotice: "Les fonds seront conservés par un partenaire agréé jusqu'à votre validation.",
    },
    payout: {
      channel: {
        wave: "Wave",
        orange_money: "Orange Money",
        mtn_momo: "MTN MoMo",
        moov_money: "Moov Money",
        bank_transfer: "Virement bancaire",
      },
    },
    common: {
      from: "À partir de",
      loading: "Chargement…",
      error: "Une erreur est survenue.",
      retry: "Réessayer",
    },
  },
  en: {
    brand: {
      name: "Toomny",
      tagline: "Work together, grow together.",
    },
    nav: {
      browse: "Browse",
      howItWorks: "How it works",
      becomeProvider: "Offer my services",
      login: "Log in",
      signup: "Sign up",
      dashboard: "Dashboard",
      orders: "Orders",
      messages: "Messages",
    },
    promise: {
      provider: "Paid to your mobile money after approval.",
      client: "Your payment is held until delivery.",
      commission: "You keep between 90% and 97% of what you charge.",
    },
    order: {
      status: {
        pending_payment: "Awaiting payment",
        funded: "Funds secured",
        in_progress: "In progress",
        delivered: "Delivered",
        completed: "Completed",
        disputed: "Disputed",
        cancelled: "Cancelled",
        refunded: "Refunded",
      },
      deliveryIn: "Delivery in {days} day(s)",
      escrowNotice: "Funds are held by our licensed partner until you approve.",
    },
    payout: {
      channel: {
        wave: "Wave",
        orange_money: "Orange Money",
        mtn_momo: "MTN MoMo",
        moov_money: "Moov Money",
        bank_transfer: "Bank transfer",
      },
    },
    common: {
      from: "From",
      loading: "Loading…",
      error: "Something went wrong.",
      retry: "Retry",
    },
  },
} as const;

export type Dictionary = (typeof dictionaries)["fr"];

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] as Dictionary;
}

// Textes des pages publiques et des titres de page, FR et EN.
import type { Locale } from "./dictionaries";

const fr = {
  notFound: {
    title: "Page introuvable",
    body: "Cette page n'existe pas ou a été déplacée.",
    home: "Retour à l'accueil",
  },
  cgu: {
    metaTitle: "Conditions d'utilisation",
    title: "Conditions d'utilisation",
    // Texte provisoire : à remplacer par la version validée par un juriste.
    body: "Les conditions d'utilisation de Toomny sont en cours de rédaction. Elles seront publiées ici avant l'ouverture des paiements.",
    home: "Retour à l'accueil",
  },
  error: {
    title: "Une erreur est survenue",
    body: "Réessayez dans un instant. Si le problème persiste, contactez-nous.",
    retry: "Réessayer",
  },
  site: {
    title: "Toomny — Recrutez les meilleurs talents d'Afrique de l'Ouest",
    description:
      "Toomny connecte les entreprises d'Afrique de l'Ouest aux prestataires du continent. Paiement en mobile money, paiement conservé jusqu'à la livraison. Dès 3 % de commission côté prestataire, 0 % côté client.",
    ogTitle: "Toomny — Travailler ensemble, grandir ensemble",
    ogDescription: "La marketplace de talents d'Afrique de l'Ouest. Paiement mobile money, conservé jusqu'à la livraison.",
  },
  titles: {
    auth: "Créer un compte",
    authDescription:
      "Rejoignez Toomny : recrutez un prestataire d'Afrique de l'Ouest, ou vendez vos services et soyez payé en mobile money.",
    order: "Commande · Toomny",
    orders: "Mes commandes · Toomny",
    dashboard: "Tableau de bord · Toomny",
    verification: "Vérification d'identité · Toomny",
    profile: "Mon profil public · Toomny",
    services: "Mes prestations · Toomny",
    pricing: "Tarifs — Toomny",
    pricingDescription:
      "Plan gratuit inclus. Dès 3 % de commission côté prestataire, 0 % côté client. Plans Débutant, Essentiel, Pro et Expert. Versement direct en mobile money.",
    howItWorks: "Comment ça marche — Toomny",
    howItWorksDescription:
      "Trois étapes pour recruter un prestataire ou vendre vos services en toute confiance, avec paiement en mobile money et séquestre automatique.",
    security: "Sécurité — Toomny",
    securityDescription:
      "Votre paiement est conservé par un établissement agréé. Identité vérifiée, litige arbitré en français, versement automatique sous 72 h.",
  },
};

const en: typeof fr = {
  notFound: {
    title: "Page not found",
    body: "This page does not exist or has moved.",
    home: "Back to home",
  },
  cgu: {
    metaTitle: "Terms of use",
    title: "Terms of use",
    // Provisional wording: to be replaced by the version approved by a lawyer.
    body: "Toomny's terms of use are being drafted. They will be published here before payments open.",
    home: "Back to home",
  },
  error: {
    title: "Something went wrong",
    body: "Try again in a moment. If the problem persists, contact us.",
    retry: "Try again",
  },
  site: {
    title: "Toomny — Hire the best talent in West Africa",
    description:
      "Toomny connects West African businesses with providers across the continent. Mobile money payments, held until delivery. From 3% commission, 0% for buyers.",
    ogTitle: "Toomny — Work together, grow together",
    ogDescription: "The talent marketplace for West Africa. Mobile money payments, held until delivery.",
  },
  titles: {
    auth: "Create an account",
    authDescription:
      "Join Toomny: hire a vetted provider in West Africa, or sell your services and get paid by mobile money.",
    order: "Order · Toomny",
    orders: "My orders · Toomny",
    dashboard: "Dashboard · Toomny",
    verification: "Identity verification · Toomny",
    profile: "My public profile · Toomny",
    services: "My services · Toomny",
    pricing: "Pricing — Toomny",
    pricingDescription:
      "Free plan included. From 3% commission on the provider side, 0% for buyers. Starter, Essential, Pro and Expert plans. Paid out directly by mobile money.",
    howItWorks: "How it works — Toomny",
    howItWorksDescription:
      "Three steps to hire a provider or sell your services with confidence, with mobile money payment and automatic escrow.",
    security: "Security — Toomny",
    securityDescription:
      "Your payment is held by a licensed institution. Verified identity, disputes arbitrated in French, automatic release within 72 hours.",
  },
};

export const publicPageTexts: Record<Locale, typeof fr> = { fr, en };

export function getPublicPageTexts(locale: Locale): typeof fr {
  return publicPageTexts[locale];
}

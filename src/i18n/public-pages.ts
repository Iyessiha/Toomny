// Textes des pages publiques sans parcours (404, conditions d'utilisation), FR et EN.
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
};

export const publicPageTexts: Record<Locale, typeof fr> = { fr, en };

export function getPublicPageTexts(locale: Locale): typeof fr {
  return publicPageTexts[locale];
}

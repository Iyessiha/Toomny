// Pages légales, FR et EN. Les passages entre crochets sont à compléter et à faire valider par un juriste.
import type { Locale } from "@/i18n/dictionaries";

export type LegalSection = { heading: string; paragraphs: string[] };
export type LegalPage = { metaTitle: string; title: string; updated: string; intro: string; sections: LegalSection[] };

const fr = {
  legalNotice: {
    metaTitle: "Mentions légales · Toomny",
    title: "Mentions légales",
    updated: "Version provisoire, à valider avant l'ouverture des paiements.",
    intro: "Ces informations identifient l'éditeur et l'hébergeur du site Toomny.",
    sections: [
      {
        heading: "Éditeur",
        paragraphs: [
          "Toomny est édité par MonWe Infinity LLC.",
          "Siège social : [à compléter]. Immatriculation : [à compléter]. Représentant légal : [à compléter].",
          "Contact : [adresse e-mail à compléter].",
        ],
      },
      {
        heading: "Directeur de la publication",
        paragraphs: ["[Nom à compléter]."],
      },
      {
        heading: "Hébergement",
        paragraphs: [
          "Le site est hébergé par Vercel Inc. (États-Unis).",
          "Les données sont stockées par Supabase Inc. (base de données, fichiers). Région d'hébergement : [à compléter].",
        ],
      },
      {
        heading: "Paiements",
        paragraphs: [
          "Les paiements par mobile money ne sont pas encore ouverts. Les fonds ne seront conservés que par un partenaire de paiement agréé, jamais par Toomny directement.",
        ],
      },
      {
        heading: "Propriété intellectuelle",
        paragraphs: [
          "La marque, le logo et les contenus du site sont protégés. Toute reproduction sans autorisation écrite est interdite.",
        ],
      },
    ],
  },
  privacy: {
    metaTitle: "Confidentialité · Toomny",
    title: "Politique de confidentialité",
    updated: "Version provisoire, à valider par un juriste avant publication.",
    intro: "Cette page explique quelles données Toomny collecte, pourquoi, combien de temps, et comment exercer vos droits.",
    sections: [
      {
        heading: "Données collectées",
        paragraphs: [
          "Compte : nom, e-mail, téléphone, ville, pays, rôle (client ou prestataire), langue.",
          "Prestataires : présentation publique, prestations, numéro mobile money pour le versement.",
          "Vérification d'identité : type et pays du document, nom et date de naissance déclarés, photo du document et selfie. Ces fichiers sont stockés dans un espace privé et visibles uniquement par l'équipe de vérification.",
          "Activité : commandes, messages, avis, litiges, et écritures comptables liées aux commandes.",
          "Technique : adresse IP et empreinte de votre e-mail, utilisées uniquement pour limiter les tentatives de connexion et d'inscription.",
        ],
      },
      {
        heading: "Pourquoi",
        paragraphs: [
          "Faire fonctionner la marketplace (comptes, commandes, messagerie), vérifier l'identité avant tout versement, prévenir la fraude, et respecter les obligations comptables.",
        ],
      },
      {
        heading: "Cookies",
        paragraphs: [
          "Un cookie de session, indispensable à la connexion. Un cookie qui mémorise votre langue, pour un an. Le contrôle anti-robot Cloudflare Turnstile peut déposer ses propres cookies techniques.",
          "Nous n'utilisons pas de cookies publicitaires.",
        ],
      },
      {
        heading: "Sous-traitants",
        paragraphs: [
          "Supabase (base de données et stockage), Vercel (hébergement), Cloudflare (contrôle anti-robot), et le partenaire de paiement lorsque les paiements seront ouverts.",
        ],
      },
      {
        heading: "Durées de conservation",
        paragraphs: [
          "Données de compte : pendant la durée du compte, puis anonymisées à la suppression. Commandes et écritures comptables : [durée à compléter selon les obligations comptables]. Pièces d'identité : supprimées à la suppression du compte. Données de limitation des tentatives : [durée à compléter].",
        ],
      },
      {
        heading: "Vos droits",
        paragraphs: [
          "Télécharger vos données : depuis « Mon compte », un fichier JSON contient vos données.",
          "Supprimer votre compte : depuis « Mon compte ». La suppression est refusée tant qu'une commande ou un versement est en cours. Les commandes passées restent enregistrées de façon anonyme, pour la comptabilité et les litiges.",
          "Corriger vos informations : depuis votre profil.",
          "Pour toute autre demande : [adresse de contact à compléter].",
        ],
      },
    ],
  },
};

const en: typeof fr = {
  legalNotice: {
    metaTitle: "Legal notice · Toomny",
    title: "Legal notice",
    updated: "Provisional version, to be validated before payments open.",
    intro: "This information identifies the publisher and the host of the Toomny website.",
    sections: [
      {
        heading: "Publisher",
        paragraphs: [
          "Toomny is published by MonWe Infinity LLC.",
          "Registered office: [to complete]. Registration: [to complete]. Legal representative: [to complete].",
          "Contact: [e-mail address to complete].",
        ],
      },
      {
        heading: "Publication director",
        paragraphs: ["[Name to complete]."],
      },
      {
        heading: "Hosting",
        paragraphs: [
          "The website is hosted by Vercel Inc. (United States).",
          "Data is stored by Supabase Inc. (database, files). Hosting region: [to complete].",
        ],
      },
      {
        heading: "Payments",
        paragraphs: [
          "Mobile money payments are not open yet. Funds will only be held by a licensed payment partner, never by Toomny directly.",
        ],
      },
      {
        heading: "Intellectual property",
        paragraphs: [
          "The brand, logo and site content are protected. Any reproduction without written permission is prohibited.",
        ],
      },
    ],
  },
  privacy: {
    metaTitle: "Privacy · Toomny",
    title: "Privacy policy",
    updated: "Provisional version, to be validated by a lawyer before publication.",
    intro: "This page explains which data Toomny collects, why, for how long, and how to exercise your rights.",
    sections: [
      {
        heading: "Data we collect",
        paragraphs: [
          "Account: name, e-mail, phone, city, country, role (client or provider), language.",
          "Providers: public profile, services, mobile money number for payouts.",
          "Identity verification: document type and country, declared name and date of birth, photo of the document and selfie. These files are stored in a private space, visible only to the verification team.",
          "Activity: orders, messages, reviews, disputes, and accounting entries linked to orders.",
          "Technical: IP address and a fingerprint of your e-mail, used only to limit sign-in and sign-up attempts.",
        ],
      },
      {
        heading: "Why",
        paragraphs: [
          "To run the marketplace (accounts, orders, messaging), verify identity before any payout, prevent fraud, and meet accounting obligations.",
        ],
      },
      {
        heading: "Cookies",
        paragraphs: [
          "A session cookie, required to stay signed in. A cookie that remembers your language, for one year. The Cloudflare Turnstile anti-bot check may set its own technical cookies.",
          "We do not use advertising cookies.",
        ],
      },
      {
        heading: "Processors",
        paragraphs: [
          "Supabase (database and storage), Vercel (hosting), Cloudflare (anti-bot check), and the payment partner once payments open.",
        ],
      },
      {
        heading: "Retention",
        paragraphs: [
          "Account data: for as long as the account exists, then anonymised on deletion. Orders and accounting entries: [duration to complete according to accounting obligations]. Identity documents: deleted when the account is deleted. Attempt-limiting data: [duration to complete].",
        ],
      },
      {
        heading: "Your rights",
        paragraphs: [
          "Download your data: from “My account”, a JSON file contains your data.",
          "Delete your account: from “My account”. Deletion is refused while an order or a payout is in progress. Past orders stay on record in anonymous form, for accounting and disputes.",
          "Correct your information: from your profile.",
          "For any other request: [contact address to complete].",
        ],
      },
    ],
  },
};

export const legalTexts: Record<Locale, typeof fr> = { fr, en };

export function getLegalTexts(locale: Locale): typeof fr {
  return legalTexts[locale];
}

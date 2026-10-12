// Pages légales, FR et EN. Les passages entre crochets sont à compléter et à faire valider par un juriste.
import type { Locale } from "@/i18n/dictionaries";

export type LegalSection = { heading: string; paragraphs: string[] };
export type LegalPage = { metaTitle: string; title: string; updated: string; intro: string; sections: LegalSection[] };

const fr = {
  cgu: {
    metaTitle: "Conditions générales d'utilisation · Toomny",
    title: "Conditions générales d'utilisation",
    updated: "Version 1.0 — à faire valider par un juriste avant l'ouverture des paiements.",
    intro:
      "Ces conditions régissent l'utilisation de la plateforme Toomny. En créant un compte, vous les acceptez sans réserve. Elles forment un contrat entre vous et MonWe Infinity LLC, éditeur de Toomny.",
    sections: [
      {
        heading: "1. Objet et définitions",
        paragraphs: [
          "Toomny est une place de marché qui met en relation des clients et des prestataires de services indépendants, principalement en Afrique de l'Ouest.",
          "« Plateforme » désigne le site Toomny et ses services. « Client » désigne l'utilisateur qui commande une prestation. « Prestataire » désigne l'utilisateur qui propose et exécute une prestation. « Commande » désigne le contrat de service conclu entre un client et un prestataire via la plateforme.",
          "Toomny n'est pas partie au contrat de prestation. Toomny fournit l'outil de mise en relation, de messagerie, de conservation des fonds et de règlement des litiges. Le prestataire exécute la prestation sous sa seule responsabilité, en qualité d'indépendant, sans lien de subordination avec Toomny ni avec le client.",
        ],
      },
      {
        heading: "2. Compte et éligibilité",
        paragraphs: [
          "L'ouverture d'un compte requiert d'être âgé d'au moins 18 ans et d'avoir la capacité juridique de contracter. Un compte est personnel : les identifiants ne doivent pas être partagés.",
          "Les informations fournies doivent être exactes et tenues à jour. Toomny peut suspendre ou fermer un compte en cas d'informations fausses, d'usurpation d'identité, de fraude, ou de manquement répété aux présentes conditions.",
          "Une vérification d'identité (KYC) est obligatoire pour tout prestataire avant le premier versement. Elle peut également être demandée à un client en cas de soupçon de fraude. Tant que la vérification n'est pas validée, aucun versement n'est effectué.",
        ],
      },
      {
        heading: "3. Prestations et obligations du prestataire",
        paragraphs: [
          "Le prestataire décrit chaque prestation de manière exacte et complète : contenu livré, prix, délai de livraison, éventuels paliers d'offre. Il s'engage à ne proposer que des prestations qu'il est en droit et en capacité d'exécuter.",
          "Le prestataire est seul responsable de la qualité et de la légalité de ce qu'il livre, des droits de propriété intellectuelle sur les éléments livrés, ainsi que de ses propres obligations fiscales et sociales dans son pays de résidence.",
          "Toomny peut refuser, mettre en pause ou retirer une prestation qui enfreint les présentes conditions, la loi applicable, ou qui porte atteinte aux droits d'un tiers.",
        ],
      },
      {
        heading: "4. Obligations du client",
        paragraphs: [
          "Le client fournit au prestataire, dans un délai raisonnable, les informations et éléments nécessaires à l'exécution de la prestation. Un retard imputable au client ne peut être reproché au prestataire.",
          "Le client s'engage à ne pas détourner la plateforme pour contourner la commission : toute sollicitation visant à traiter et payer hors de Toomny une prestation initiée sur la plateforme constitue un manquement pouvant entraîner la fermeture du compte.",
        ],
      },
      {
        heading: "5. Contenus interdits",
        paragraphs: [
          "Sont notamment interdits : les prestations illégales, les contenus sexuels, violents ou haineux, l'usurpation d'identité, le démarchage non sollicité, les logiciels malveillants, la revente de données personnelles, les jeux d'argent non autorisés, et toute activité relevant du blanchiment ou du financement du terrorisme.",
          "Les échanges passent par la messagerie de la plateforme. Toomny peut consulter les messages d'une commande dans le seul cadre du traitement d'un litige ou d'un signalement.",
        ],
      },
      {
        heading: "6. Prix, commission et paiement",
        paragraphs: [
          "Les prix sont affichés dans la devise de la prestation, toutes taxes éventuelles à la charge du prestataire. Le client paie le montant affiché : aucune commission n'est prélevée côté client.",
          "Toomny prélève une commission sur chaque commande finalisée, retenue sur la somme versée au prestataire. Le taux dépend du plan du prestataire : 10 % (plan Débutant, gratuit), 8 % (plan Essentiel, 10 000 FCFA/mois), 5 % (plan Pro, 15 000 FCFA/mois) ou 3 % (plan Expert, 25 000 FCFA/mois). Aucune commission n'est prélevée sur le client. Le détail du calcul est affiché avant la confirmation de la commande.",
          "Les frais éventuels de l'opérateur de mobile money ou du partenaire de paiement sont indiqués au moment du paiement et ne sont pas conservés par Toomny.",
        ],
      },
      {
        heading: "7. Conservation des fonds et versement",
        paragraphs: [
          "Le paiement du client est conservé par le partenaire de paiement agréé jusqu'à la validation de la livraison. Toomny ne détient jamais les fonds directement.",
          "Une fois le prestataire marqué « livré », le client dispose de 72 heures pour accepter la livraison ou ouvrir un litige. Sans action de sa part dans ce délai, la commande est considérée comme acceptée et les fonds sont libérés au profit du prestataire.",
          "Le prestataire demande ensuite le versement de son solde disponible sur le canal mobile money enregistré dans son compte. Le versement n'est possible qu'après validation de la vérification d'identité, et le prestataire est responsable de l'exactitude du numéro renseigné.",
        ],
      },
      {
        heading: "8. Annulation, litiges et remboursement",
        paragraphs: [
          "Une commande non encore payée peut être annulée librement par l'une ou l'autre partie. Une commande payée peut être annulée d'un commun accord : les fonds sont alors remboursés au client.",
          "En cas de désaccord sur la livraison, chaque partie peut ouvrir un litige depuis la commande, dans les 72 heures suivant la livraison. Les deux parties sont invitées à produire leurs éléments dans le fil de la commande.",
          "Toomny examine le dossier et décide d'un remboursement au client ou d'une libération des fonds au prestataire. Cette décision est prise sur la base des éléments produits, de la description de la prestation et des échanges entre les parties. Elle n'a pas valeur de jugement et ne prive aucune partie de son droit d'agir en justice.",
          "Les prestations déjà exécutées et acceptées ne donnent pas lieu à remboursement.",
        ],
      },
      {
        heading: "9. Avis et réputation",
        paragraphs: [
          "Un avis ne peut être déposé qu'à l'issue d'une commande réellement payée et exécutée. Les avis doivent être sincères et porter sur la prestation, à l'exclusion de tout propos injurieux, diffamatoire ou discriminatoire.",
          "Toomny peut retirer un avis manifestement faux, acheté, hors sujet ou illicite. Les avis ne sont pas modifiables par le prestataire noté.",
        ],
      },
      {
        heading: "10. Propriété intellectuelle",
        paragraphs: [
          "La marque, le logo, l'interface et le code de Toomny restent la propriété de MonWe Infinity LLC. Aucune licence n'est accordée au-delà de l'usage normal de la plateforme.",
          "Sauf accord écrit différent entre le client et le prestataire, les droits sur les éléments livrés sont cédés au client une fois la commande payée et acceptée. Le prestataire conserve le droit de citer la prestation dans son portfolio, sauf demande contraire du client.",
          "En publiant une prestation, le prestataire autorise Toomny à afficher ses textes et images sur la plateforme et dans ses supports de promotion.",
        ],
      },
      {
        heading: "11. Responsabilité",
        paragraphs: [
          "Toomny est responsable du bon fonctionnement de la plateforme, dans la limite d'une obligation de moyens. Le service peut être interrompu pour maintenance ou pour une cause extérieure (panne d'un opérateur, d'un hébergeur ou d'un partenaire de paiement).",
          "Toomny n'est pas responsable de la qualité, du retard ou de l'inexécution d'une prestation, qui relèvent du prestataire, ni des manquements du client. La responsabilité de Toomny, lorsqu'elle est engagée, est limitée au montant des commissions perçues sur la commande concernée.",
          "Aucune des parties n'est responsable d'un dommage indirect tel qu'une perte de chiffre d'affaires, de données ou d'opportunité commerciale.",
        ],
      },
      {
        heading: "12. Données personnelles",
        paragraphs: [
          "Le traitement des données est décrit dans la politique de confidentialité, qui fait partie intégrante des présentes conditions.",
        ],
      },
      {
        heading: "13. Suspension et fermeture de compte",
        paragraphs: [
          "Vous pouvez fermer votre compte à tout moment depuis « Mon compte ». La fermeture est refusée tant qu'une commande ou un versement est en cours.",
          "Toomny peut suspendre un compte sans préavis en cas de fraude, de risque pour les autres utilisateurs, ou d'obligation légale. Les commandes en cours sont alors traitées jusqu'à leur terme ou remboursées.",
        ],
      },
      {
        heading: "14. Modification des conditions",
        paragraphs: [
          "Toomny peut modifier les présentes conditions. Toute modification substantielle est notifiée au moins 30 jours avant son entrée en vigueur. La poursuite de l'utilisation du service après cette date vaut acceptation. À défaut d'acceptation, vous pouvez fermer votre compte.",
        ],
      },
      {
        heading: "15. Droit applicable et litiges",
        paragraphs: [
          "Les présentes conditions sont soumises au droit [à compléter par un juriste : droit applicable retenu]. Tout litige relatif à leur interprétation ou à leur exécution relève des juridictions [à compléter].",
          "Avant toute action, les parties s'efforcent de trouver une solution amiable en écrivant à [adresse e-mail de contact à compléter].",
        ],
      },
    ],
  },
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
  cgu: {
    metaTitle: "Terms of Service · Toomny",
    title: "Terms of Service",
    updated: "Version 1.0 — to be reviewed by a lawyer before payments open.",
    intro:
      "These terms govern the use of the Toomny platform. By creating an account, you accept them without reservation. They form a contract between you and MonWe Infinity LLC, publisher of Toomny.",
    sections: [
      {
        heading: "1. Purpose and definitions",
        paragraphs: [
          "Toomny is a marketplace connecting clients and independent service providers, primarily in West Africa.",
          '"Platform" means the Toomny website and its services. "Client" means the user who orders a service. "Provider" means the user who offers and performs a service. "Order" means the service contract concluded between a client and a provider through the platform.',
          "Toomny is not a party to the service contract. Toomny provides the tool for connecting parties, messaging, holding funds, and resolving disputes. The provider performs the service under their sole responsibility, as an independent contractor, with no subordinate relationship to Toomny or to the client.",
        ],
      },
      {
        heading: "2. Account and eligibility",
        paragraphs: [
          "Opening an account requires being at least 18 years of age and having the legal capacity to enter into contracts. An account is personal: credentials must not be shared.",
          "The information provided must be accurate and kept up to date. Toomny may suspend or close an account in the event of false information, identity theft, fraud, or repeated breach of these terms.",
          "Identity verification (KYC) is mandatory for any provider before the first payout. It may also be requested from a client if fraud is suspected. No payout is made until verification is validated.",
        ],
      },
      {
        heading: "3. Services and provider obligations",
        paragraphs: [
          "The provider describes each service accurately and completely: delivered content, price, delivery time, any tiered offer levels. They undertake to only offer services they are legally entitled and able to perform.",
          "The provider is solely responsible for the quality and legality of what they deliver, the intellectual property rights over delivered elements, and their own tax and social security obligations in their country of residence.",
          "Toomny may refuse, pause, or remove a service that breaches these terms, applicable law, or infringes the rights of a third party.",
        ],
      },
      {
        heading: "4. Client obligations",
        paragraphs: [
          "The client provides the provider, within a reasonable time, with the information and materials needed to perform the service. A delay attributable to the client cannot be held against the provider.",
          "The client undertakes not to use the platform to bypass the commission: any solicitation aimed at processing and paying outside Toomny for a service initiated on the platform constitutes a breach that may lead to account closure.",
        ],
      },
      {
        heading: "5. Prohibited content",
        paragraphs: [
          "Prohibited in particular: illegal services, sexual, violent or hateful content, identity theft, unsolicited solicitation, malware, sale of personal data, unlicensed gambling, and any activity related to money laundering or terrorist financing.",
          "Exchanges must go through the platform's messaging. Toomny may consult messages from an order solely in the context of processing a dispute or report.",
        ],
      },
      {
        heading: "6. Pricing, commission, and payment",
        paragraphs: [
          "Prices are displayed in the service currency, with any applicable taxes borne by the provider. The client pays the displayed amount: no commission is charged on the client side.",
          "Toomny charges a commission on each completed order, retained from the sum paid to the provider. The rate depends on the provider's plan: 10% (free Starter plan), 8% (Essential plan, 10,000 FCFA/month), 5% (Pro plan, 15,000 FCFA/month), or 3% (Expert plan, 25,000 FCFA/month). No commission is charged to the client. The calculation detail is shown before order confirmation.",
          "Any fees charged by the mobile money operator or payment partner are indicated at the time of payment and are not retained by Toomny.",
        ],
      },
      {
        heading: "7. Fund holding and payout",
        paragraphs: [
          "The client's payment is held by the licensed payment partner until delivery is validated. Toomny never holds funds directly.",
          "Once the provider marks the order as \"delivered\", the client has 72 hours to accept the delivery or open a dispute. Without action on their part within this period, the order is considered accepted and the funds are released to the provider.",
          "The provider then requests payout of their available balance to the mobile money number registered in their account. Payout is only possible after identity verification is validated, and the provider is responsible for the accuracy of the number provided.",
        ],
      },
      {
        heading: "8. Cancellation, disputes, and refunds",
        paragraphs: [
          "An unpaid order may be freely cancelled by either party. A paid order may be cancelled by mutual agreement: funds are then refunded to the client.",
          "In the event of disagreement over delivery, either party may open a dispute from the order, within 72 hours of delivery. Both parties are invited to submit their evidence in the order thread.",
          "Toomny examines the case and decides on a refund to the client or a release of funds to the provider. This decision is made based on the evidence submitted, the service description, and the exchanges between the parties. It does not have the force of a judgment and does not deprive either party of the right to take legal action.",
          "Services already performed and accepted are not eligible for a refund.",
        ],
      },
      {
        heading: "9. Reviews and reputation",
        paragraphs: [
          "A review may only be left following an order that was actually paid and completed. Reviews must be genuine and relate to the service, excluding any insulting, defamatory or discriminatory content.",
          "Toomny may remove a review that is manifestly false, purchased, off-topic or unlawful. Reviews cannot be modified by the rated provider.",
        ],
      },
      {
        heading: "10. Intellectual property",
        paragraphs: [
          "The Toomny brand, logo, interface and code remain the property of MonWe Infinity LLC. No licence is granted beyond normal use of the platform.",
          "Unless a different written agreement exists between the client and the provider, rights to delivered elements are assigned to the client once the order is paid and accepted. The provider retains the right to cite the service in their portfolio, unless the client requests otherwise.",
          "By publishing a service, the provider authorises Toomny to display their texts and images on the platform and in its promotional materials.",
        ],
      },
      {
        heading: "11. Liability",
        paragraphs: [
          "Toomny is responsible for the proper functioning of the platform, limited to a best-efforts obligation. The service may be interrupted for maintenance or due to an external cause (failure of an operator, hosting provider, or payment partner).",
          "Toomny is not responsible for the quality, delay, or non-performance of a service, which are the provider's responsibility, nor for the client's failures. Toomny's liability, when engaged, is limited to the amount of commissions collected on the order in question.",
          "Neither party is liable for indirect damage such as loss of revenue, data, or business opportunity.",
        ],
      },
      {
        heading: "12. Personal data",
        paragraphs: [
          "Data processing is described in the privacy policy, which forms an integral part of these terms.",
        ],
      },
      {
        heading: "13. Account suspension and closure",
        paragraphs: [
          "You may close your account at any time from \"My account\". Closure is refused while an order or a payout is in progress.",
          "Toomny may suspend an account without notice in the event of fraud, risk to other users, or a legal obligation. Ongoing orders are then processed to completion or refunded.",
        ],
      },
      {
        heading: "14. Changes to terms",
        paragraphs: [
          "Toomny may amend these terms. Any material change is notified at least 30 days before it takes effect. Continued use of the service after that date constitutes acceptance. If you do not accept, you may close your account.",
        ],
      },
      {
        heading: "15. Governing law and disputes",
        paragraphs: [
          "These terms are governed by [to be completed by a lawyer: applicable governing law]. Any dispute relating to their interpretation or performance falls under the jurisdiction of [to be completed].",
          "Before any legal action, the parties shall endeavour to find an amicable solution by writing to [contact e-mail address to be completed].",
        ],
      },
    ],
  },
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

import type { Locale } from "./dictionaries";

// Motifs de refus proposés à l'admin. Les clés sont stockées dans les e-mails : ne pas les renommer.
export const REJECTION_REASONS = [
  "title_unclear",
  "cover_missing",
  "cover_poor",
  "description_short",
  "price_unclear",
  "wrong_category",
  "contact_in_text",
  "other",
] as const;

export type RejectionReason = (typeof REJECTION_REASONS)[number];

export function isRejectionReason(value: string): value is RejectionReason {
  return (REJECTION_REASONS as readonly string[]).includes(value);
}

export type GuideSection = { title: string; items: string[] };

export type ListingGuideTexts = {
  reasons: Record<RejectionReason, string>;
  email: {
    subject: (service: string) => string;
    greeting: (firstName: string) => string;
    intro: (service: string) => string;
    reasonsTitle: string;
    messageTitle: string;
    guideTitle: string;
    guide: GuideSection[];
    cta: string;
    closing: string;
    signature: string;
  };
};

const fr: ListingGuideTexts = {
  reasons: {
    title_unclear: "Titre peu clair ou trop vague",
    cover_missing: "Photo de couverture manquante",
    cover_poor: "Photo de couverture floue, sombre ou peu représentative",
    description_short: "Description trop courte pour décrire ce que vous proposez",
    price_unclear: "Prix ou délai incohérent ou peu clair",
    wrong_category: "Catégorie qui ne correspond pas à la prestation",
    contact_in_text: "Coordonnées (téléphone, e-mail, lien) dans le texte",
    other: "Autre point à corriger",
  },
  email: {
    subject: (service) => `Votre prestation « ${service} » n'a pas encore été publiée`,
    greeting: (firstName) => `Bonjour ${firstName},`,
    intro: (service) =>
      `Merci d'avoir proposé « ${service} » sur Toomny. Nous avons relu votre annonce et nous ne pouvons pas encore la publier. Rien de grave : il s'agit le plus souvent de petits ajustements, et votre prestation peut être publiée dès qu'ils sont faits.`,
    reasonsTitle: "Ce que nous avons relevé",
    messageTitle: "Message de notre équipe",
    guideTitle: "Comment rédiger une annonce qui se publie",
    guide: [
      {
        title: "1. Un titre clair",
        items: [
          "Dites en quelques mots ce que vous faites et pour qui, en 5 à 10 mots environ.",
          "Exemple : « Montage vidéo pour réseaux sociaux, livraison en 48 h ».",
        ],
      },
      {
        title: "2. Une description complète",
        items: [
          "Décrivez ce qui est inclus, votre méthode de travail et ce que le client doit vous fournir.",
          "Indiquez les délais, les révisions prévues et ce qui n'est pas inclus.",
          "Visez au moins quatre ou cinq phrases complètes, relues avant envoi.",
        ],
      },
      {
        title: "3. Un prix et un délai réalistes",
        items: [
          "Fixez un prix qui correspond vraiment au travail proposé, en FCFA.",
          "Indiquez le délai de livraison en jours.",
          "Si vous proposez plusieurs formules, chacune doit avoir un nom, une description, un prix et un délai.",
        ],
      },
      {
        title: "4. La photo de couverture",
        items: [
          "C'est la première chose que voit le client : soignez-la.",
          "Format recommandé : 1280 × 720 px (16:9), en JPEG, PNG ou WebP, 3 Mo maximum.",
          "Montrez un résultat concret de votre travail, bien éclairé et net.",
          "Évitez le texte, les logos, les filigranes et les captures d'écran floues.",
        ],
      },
      {
        title: "5. La galerie",
        items: [
          "Ajoutez jusqu'à 4 images supplémentaires (JPEG, PNG ou WebP, 3 Mo maximum chacune).",
          "Choisissez des exemples variés et récents de votre travail, plutôt que des visuels génériques.",
        ],
      },
      {
        title: "6. La bonne catégorie",
        items: ["Choisissez la catégorie qui correspond vraiment à votre prestation : c'est elle qui détermine où votre annonce apparaît."],
      },
      {
        title: "7. Pas de coordonnées dans l'annonce",
        items: [
          "N'indiquez ni numéro de téléphone, ni e-mail, ni lien vers un autre site dans le titre ou la description.",
          "Les échanges et les paiements se font sur Toomny : cela vous protège, et protège vos clients.",
        ],
      },
      {
        title: "8. Relisez avant d'envoyer",
        items: [
          "Relisez votre annonce comme un client qui ne vous connaît pas : est-ce clair, complet et honnête ?",
          "Vous pouvez la modifier et la renvoyer à tout moment, nous la réexaminerons rapidement.",
        ],
      },
    ],
    cta: "Modifier ma prestation",
    closing: "Merci pour votre patience et bienvenue sur Toomny.",
    signature: "L'équipe Toomny",
  },
};

const en: ListingGuideTexts = {
  reasons: {
    title_unclear: "Title unclear or too vague",
    cover_missing: "Cover photo missing",
    cover_poor: "Cover photo blurry, dark or not representative",
    description_short: "Description too short to explain what you offer",
    price_unclear: "Price or delivery time inconsistent or unclear",
    wrong_category: "Category does not match the service",
    contact_in_text: "Contact details (phone, email, link) in the text",
    other: "Other point to fix",
  },
  email: {
    subject: (service) => `Your service « ${service} » has not been published yet`,
    greeting: (firstName) => `Hello ${firstName},`,
    intro: (service) =>
      `Thank you for offering « ${service} » on Toomny. We reviewed your listing and cannot publish it yet. Nothing serious: these are usually small adjustments, and your service can go live as soon as they are done.`,
    reasonsTitle: "What we noticed",
    messageTitle: "Message from our team",
    guideTitle: "How to write a listing that gets published",
    guide: [
      {
        title: "1. A clear title",
        items: [
          "Say in a few words what you do and for whom, about 5 to 10 words.",
          "Example: « Video editing for social media, delivered in 48 h ».",
        ],
      },
      {
        title: "2. A complete description",
        items: [
          "Describe what is included, how you work and what the client must provide.",
          "State delivery times, planned revisions and what is not included.",
          "Aim for at least four or five complete sentences, proofread before sending.",
        ],
      },
      {
        title: "3. A realistic price and delivery time",
        items: [
          "Set a price that really matches the work, in FCFA.",
          "Give the delivery time in days.",
          "If you offer several packages, each one needs a name, a description, a price and a delivery time.",
        ],
      },
      {
        title: "4. The cover photo",
        items: [
          "It is the first thing clients see: take care of it.",
          "Recommended format: 1280 × 720 px (16:9), JPEG, PNG or WebP, 3 MB maximum.",
          "Show a concrete result of your work, well lit and sharp.",
          "Avoid text, logos, watermarks and blurry screenshots.",
        ],
      },
      {
        title: "5. The gallery",
        items: [
          "Add up to 4 extra images (JPEG, PNG or WebP, 3 MB maximum each).",
          "Choose varied, recent examples of your work rather than generic visuals.",
        ],
      },
      {
        title: "6. The right category",
        items: ["Pick the category that really matches your service: it decides where your listing appears."],
      },
      {
        title: "7. No contact details in the listing",
        items: [
          "Do not write a phone number, an email or a link to another website in the title or description.",
          "Conversations and payments happen on Toomny: this protects you and your clients.",
        ],
      },
      {
        title: "8. Proofread before sending",
        items: [
          "Read your listing as a client who does not know you: is it clear, complete and honest?",
          "You can edit it and resubmit at any time, we will review it quickly.",
        ],
      },
    ],
    cta: "Edit my service",
    closing: "Thank you for your patience and welcome to Toomny.",
    signature: "The Toomny team",
  },
};

export const listingGuideTexts: Record<Locale, ListingGuideTexts> = { fr, en };

export function getListingGuideTexts(locale: Locale): ListingGuideTexts {
  return listingGuideTexts[locale];
}

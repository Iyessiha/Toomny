import type { Locale } from "@/i18n/dictionaries";
import { escapeHtml } from "./service-rejected";

/** Conseils pédagogiques réutilisés dans les e-mails d'accueil, de confirmation et de vérification. */
export type Tip = { title: string; items: string[] };

const TIPS: Record<Locale, { setup: Tip; profilePhoto: Tip; coverPhoto: Tip; idPhoto: Tip }> = {
  fr: {
    setup: {
      title: "Les étapes pour publier votre première prestation",
      items: [
        "Complétez votre profil dans « Mon profil » : nom, téléphone, ville et une courte présentation.",
        "Ajoutez une bonne photo de profil (conseils ci-dessous).",
        "Vérifiez votre identité dans « Vérification » : pièce d'identité recto et verso, puis un selfie. Une prestation ne peut être publiée qu'après validation, en général sous 24 à 48 h.",
        "Créez votre prestation : titre clair, description précise, prix, délai et une photo de couverture en paysage.",
        "Notre équipe la vérifie, puis elle apparaît dans le catalogue.",
      ],
    },
    profilePhoto: {
      title: "Une bonne photo de profil",
      items: [
        "Votre visage net et centré, et vous seul sur la photo.",
        "Lumière naturelle, de face, sans contre-jour.",
        "Fond uni ou simple, sans autre personne ni logo.",
        "Pas de lunettes de soleil, pas de filtre, une photo récente.",
        "Format carré, au moins 400 × 400 pixels.",
      ],
    },
    coverPhoto: {
      title: "Une bonne photo de couverture (format paysage obligatoire)",
      items: [
        "Format paysage : plus large que haute. Les photos carrées ou verticales sont refusées.",
        "Taille conseillée : au moins 1280 × 720 pixels (format 16:9).",
        "Montrez votre travail ou le résultat, bien éclairé, au centre de l'image.",
        "Pas de texte, de logo ni de numéro de téléphone sur l'image.",
        "Une seule image forte vaut mieux qu'un collage.",
      ],
    },
    idPhoto: {
      title: "Pour une pièce d'identité acceptée",
      items: [
        "Le document entier est visible, les quatre coins compris.",
        "Photo nette, sans reflet ni ombre, lisible.",
        "Recto et verso pour une carte d'identité, page d'identité pour un passeport.",
        "Selfie : votre visage seul, face à la caméra, bien éclairé.",
      ],
    },
  },
  en: {
    setup: {
      title: "The steps to publish your first service",
      items: [
        "Complete your profile under “My profile”: name, phone, city and a short introduction.",
        "Add a good profile photo (tips below).",
        "Verify your identity under “Verification”: front and back of your ID, then a selfie. A service can only be published once verified, usually within 24 to 48 hours.",
        "Create your service: clear title, precise description, price, delivery time and a landscape cover photo.",
        "Our team reviews it, then it appears in the catalogue.",
      ],
    },
    profilePhoto: {
      title: "A good profile photo",
      items: [
        "Your face sharp and centred, and only you in the photo.",
        "Natural light, facing the light source, no backlight.",
        "A plain or simple background, no other people or logos.",
        "No sunglasses, no filters, a recent photo.",
        "Square format, at least 400 × 400 pixels.",
      ],
    },
    coverPhoto: {
      title: "A good cover photo (landscape format required)",
      items: [
        "Landscape format: wider than tall. Square or portrait photos are refused.",
        "Recommended size: at least 1280 × 720 pixels (16:9).",
        "Show your work or result, well lit, centred in the frame.",
        "No text, logo or phone number on the image.",
        "One strong image works better than a collage.",
      ],
    },
    idPhoto: {
      title: "For an ID document that is accepted",
      items: [
        "The whole document is visible, all four corners included.",
        "Sharp photo, no glare or shadow, easy to read.",
        "Front and back for an ID card, identity page for a passport.",
        "Selfie: your face alone, facing the camera, well lit.",
      ],
    },
  },
};

export function guideTips(locale: Locale) {
  return TIPS[locale === "en" ? "en" : "fr"];
}

/** HTML d'une liste de conseils, dans le style sombre des e-mails Toomny. */
export function renderTipsHtml(tips: Tip[]): string {
  return tips
    .map(
      (tip) => `
        <h2 style="margin:24px 0 8px;font-size:16px;color:#1d2b23;">${escapeHtml(tip.title)}</h2>
        <ul style="margin:0 0 8px;padding-left:20px;font-size:14px;color:#4f5f56;line-height:1.7;">
          ${tip.items.map((item) => `<li style="margin:0 0 4px;">${escapeHtml(item)}</li>`).join("")}
        </ul>`,
    )
    .join("");
}

// Contrôles automatiques d'une annonce, affichés à l'admin avant publication.
// Fonction pure : testable sans base ni réseau.

export type ListingChecksInput = {
  description: string;
  coverUrl: string | null;
  galleryUrls: string[];
};

export type CheckKey = "cover" | "gallery" | "description" | "contact";

export type CheckResult = { key: CheckKey; ok: boolean };

// Téléphone (au moins 8 chiffres, espaces ou tirets autorisés), e-mail, lien web.
const PHONE_RE = /(\+?\d[\d\s.-]{7,}\d)/;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const URL_RE = /(https?:\/\/|www\.)\S+/i;

export function containsContact(text: string): boolean {
  return PHONE_RE.test(text) || EMAIL_RE.test(text) || URL_RE.test(text);
}

export function checkListing(input: ListingChecksInput): CheckResult[] {
  const description = input.description.trim();
  return [
    { key: "cover", ok: Boolean(input.coverUrl) },
    { key: "gallery", ok: input.galleryUrls.length > 0 },
    { key: "description", ok: description.length >= 100 },
    { key: "contact", ok: !containsContact(description) },
  ];
}

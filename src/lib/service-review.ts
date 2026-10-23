// Revue d'une prestation soumise : contrôles déterministes, lecture de la sortie
// de l'IA, et verdict. Fonction pure, sans réseau ni base.
import { checkListing } from "@/lib/listing-checks";
import { REJECTION_REASONS, type RejectionReason } from "@/i18n/listing-guide";

export const TITLE_MIN = 10;
export const PRICE_MIN_XOF = 5000;
export const PRICE_MAX_XOF = 10_000_000;

export type ServiceForReview = {
  title: string;
  description: string;
  priceMinor: number;
  deliveryDays: number;
  categoryId: string | null;
  coverUrl: string | null;
  galleryUrls: string[];
  packagesCount: number;
};

/** Un point à corriger : motif (clé du guide), texte à montrer au prestataire. */
export type ReviewPoint = { reason: RejectionReason; message: string };

export type ReviewVerdict = {
  /** « approve » seulement si aucun point : l'équipe peut valider. */
  verdict: "approve" | "reject";
  points: ReviewPoint[];
};

const MESSAGES = {
  cover_missing: "Ajoutez une photo de couverture : c'est la première chose que voit un client.",
  cover_poor: "La photo de couverture doit être nette et montrer votre travail.",
  description_short: "La description doit faire au moins 100 caractères : décrivez ce que vous livrez, les étapes et les délais.",
  contact_in_text: "Retirez les coordonnées (téléphone, e-mail, lien) de la description : les échanges passent par Toomny.",
  title_unclear: "Le titre doit être clair et précis (au moins 10 caractères) : nommez précisément la prestation.",
  price_unclear: "Le prix doit être cohérent avec la prestation et dans la fourchette autorisée (5 000 à 10 000 000 FCFA).",
  wrong_category: "Choisissez la catégorie qui correspond vraiment à la prestation.",
  other: "Corrigez les points signalés par l'équipe avant de resoumettre.",
} as const satisfies Record<string, string>;

/** Contrôles automatiques, sans IA : ce qui est objectif. */
export function deterministicPoints(s: ServiceForReview): ReviewPoint[] {
  const points: ReviewPoint[] = [];
  const checks = checkListing({ description: s.description, coverUrl: s.coverUrl, galleryUrls: s.galleryUrls });
  const failed = new Set(checks.filter((c) => !c.ok).map((c) => c.key));

  if (failed.has("cover")) points.push({ reason: "cover_missing", message: MESSAGES.cover_missing });
  if (failed.has("description")) points.push({ reason: "description_short", message: MESSAGES.description_short });
  if (failed.has("contact")) points.push({ reason: "contact_in_text", message: MESSAGES.contact_in_text });
  if (s.title.trim().length < TITLE_MIN) points.push({ reason: "title_unclear", message: MESSAGES.title_unclear });
  const priceXof = s.priceMinor;
  if (priceXof < PRICE_MIN_XOF || priceXof > PRICE_MAX_XOF) points.push({ reason: "price_unclear", message: MESSAGES.price_unclear });
  if (!s.categoryId) points.push({ reason: "wrong_category", message: MESSAGES.wrong_category });
  return points;
}

/** Lit la sortie de l'IA. Ne garde que les motifs connus et des messages bornés. */
export function parseAiPoints(raw: unknown): ReviewPoint[] {
  if (!raw || typeof raw !== "object" || !Array.isArray((raw as { issues?: unknown }).issues)) return [];
  const out: ReviewPoint[] = [];
  for (const item of (raw as { issues: unknown[] }).issues) {
    if (!item || typeof item !== "object") continue;
    const reason = (item as { reason?: unknown }).reason;
    const message = (item as { message?: unknown }).message;
    if (typeof reason !== "string" || !(REJECTION_REASONS as readonly string[]).includes(reason)) continue;
    if (typeof message !== "string" || message.trim() === "") continue;
    out.push({ reason: reason as RejectionReason, message: message.trim().slice(0, 300) });
  }
  return out;
}

/** Fusionne les points, un seul par motif (le premier gagne). */
export function mergePoints(...lists: ReviewPoint[][]): ReviewPoint[] {
  const seen = new Set<RejectionReason>();
  const out: ReviewPoint[] = [];
  for (const point of lists.flat()) {
    if (seen.has(point.reason)) continue;
    seen.add(point.reason);
    out.push(point);
  }
  return out;
}

/** Verdict final : valider seulement quand il ne reste aucun point. */
export function reviewVerdict(points: ReviewPoint[]): ReviewVerdict {
  return { verdict: points.length === 0 ? "approve" : "reject", points };
}

/** Texte des points, tel qu'il est enregistré et envoyé au prestataire. */
export function pointsAsNotes(points: ReviewPoint[]): string {
  return points.map((p, i) => `${i + 1}. ${p.message}`).join("\n").slice(0, 2000);
}

/** Message standard d'un motif, pour les refus et les notes enregistrées. */
export function reasonMessage(reason: RejectionReason): string {
  return MESSAGES[reason] ?? MESSAGES.other;
}

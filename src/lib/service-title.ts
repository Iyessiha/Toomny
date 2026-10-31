/** Phrase d'accroche obligatoire : chaque titre de prestation commence par « Je vais ». */
export const TITLE_PREFIX = "Je vais ";

/** Longueur maximale de la partie saisie, pour que le titre complet tienne en 120 caractères. */
export const TITLE_REST_MAX = 120 - TITLE_PREFIX.length;

/** Ajoute la phrase fixe à la partie saisie par le prestataire. Idempotent. */
export function withTitlePrefix(rest: string): string {
  const cleaned = stripTitlePrefix(rest.trim());
  return `${TITLE_PREFIX}${cleaned}`;
}

/** Retire la phrase fixe si elle est présente, pour pré-remplir le champ de saisie. */
export function stripTitlePrefix(title: string): string {
  const trimmed = title.trim();
  return trimmed.toLowerCase().startsWith(TITLE_PREFIX.toLowerCase().trim())
    ? trimmed.slice(TITLE_PREFIX.trim().length).trim()
    : trimmed;
}

/** Vrai si le titre commence déjà par la phrase fixe. */
export function hasTitlePrefix(title: string): boolean {
  return title.trim().toLowerCase().startsWith(TITLE_PREFIX.trim().toLowerCase() + " ");
}

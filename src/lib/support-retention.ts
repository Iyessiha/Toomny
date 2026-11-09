// Rétention du texte des demandes de support résolues. Fonction pure.

/** Délai après clôture au-delà duquel le texte d'une demande est effacé. */
export const SUPPORT_TEXT_RETENTION_DAYS = 90;
export const PURGED_SUBJECT = "Demande archivée";
export const PURGED_BODY = `Contenu supprimé après ${SUPPORT_TEXT_RETENTION_DAYS} jours de clôture.`;

export function retentionCutoff(now: Date = new Date()): string {
  return new Date(now.getTime() - SUPPORT_TEXT_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

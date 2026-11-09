/** Âge lisible d'un élément de file : « 3 min », « 5 h », « 2 j ». Fonction pure. */
export function ageLabel(iso: string, now: Date = new Date()): string {
  const minutes = Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / 60_000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours} h`;
  return `${Math.floor(hours / 24)} j`;
}

/** Vrai au-delà de 48 h : l'élément devient prioritaire dans la file. */
export function isStale(iso: string, now: Date = new Date()): boolean {
  return now.getTime() - new Date(iso).getTime() > 48 * 60 * 60 * 1000;
}

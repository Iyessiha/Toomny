// File d'attente des prestations en brouillon, pour la modération. Fonction pure.
// Les trois files se déduisent des champs de la prestation : aucun état séparé.

export type ServiceQueue = "new" | "resubmitted" | "rejected" | null;

export function serviceQueue(s: {
  status: string;
  review_notes: string | null;
  review_requested_at: string | null;
}): ServiceQueue {
  if (s.status !== "draft") return null;
  if (s.review_requested_at) return "resubmitted";
  if (s.review_notes) return "rejected";
  return "new";
}

/** Une file « demande une action de l'équipe » : nouvelle ou resoumise. */
export function needsTeamAction(queue: ServiceQueue): boolean {
  return queue === "new" || queue === "resubmitted";
}

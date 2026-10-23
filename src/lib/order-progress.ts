/**
 * Étapes du parcours d'une commande, vues par le client.
 * Chaque statut « atteint » l'étape d'index donné ; l'étape suivante est celle qu'on attend.
 * Les états terminaux (litige, annulation, remboursement) n'ont pas d'étape : ils
 * remplacent le parcours par un bandeau dédié.
 */
export const ORDER_STEPS = ["created", "paid", "started", "delivered", "completed"] as const;
export type OrderStep = (typeof ORDER_STEPS)[number];

const REACHED: Record<string, number> = {
  pending_payment: 0,
  funded: 1,
  in_progress: 2,
  delivered: 3,
  completed: 4,
};

export type OrderProgress = {
  /** Index de la dernière étape franchie, -1 si l'état est terminal. */
  reached: number;
  /** true pour litige, annulation, remboursement ou statut inconnu. */
  terminal: boolean;
};

export function orderProgress(status: string): OrderProgress {
  const reached = REACHED[status];
  if (reached === undefined) return { reached: -1, terminal: true };
  return { reached, terminal: false };
}

export type StepState = "done" | "next" | "upcoming";

/** État d'une étape : franchie, attendue ensuite, ou à venir. */
export function stepState(index: number, progress: OrderProgress): StepState {
  if (index <= progress.reached) return "done";
  if (index === progress.reached + 1) return "next";
  return "upcoming";
}

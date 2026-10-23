/**
 * Choisit le message d'encouragement du tableau de bord, selon l'état réel du compte.
 * Un seul message à la fois, par ordre de priorité : ce qui demande une action, puis la
 * célébration, puis l'incitation à faire connaître ses prestations ou Toomny.
 */
export type Encouragement =
  | { kind: "new_order"; count: number }
  | { kind: "to_validate"; count: number }
  | { kind: "mission_done"; count: number }
  | { kind: "publish_first" }
  | { kind: "share_services" }
  | { kind: "share_toomny" };

export type EncouragementInput = {
  isProvider: boolean;
  /** Commandes payées à démarrer (prestataire). */
  toStart: number;
  /** Livraisons à valider (client). */
  toValidate: number;
  /** Missions terminées (prestataire). */
  completed: number;
  /** Toutes les commandes du compte, toutes parties confondues. */
  orders: number;
  /** Prestations publiées (prestataire). */
  activeServices: number;
};

export function pickEncouragement(input: EncouragementInput): Encouragement | null {
  if (input.isProvider && input.toStart > 0) return { kind: "new_order", count: input.toStart };
  if (input.toValidate > 0) return { kind: "to_validate", count: input.toValidate };
  if (input.isProvider && input.completed > 0) return { kind: "mission_done", count: input.completed };
  if (input.orders === 0 && input.isProvider && input.activeServices === 0) return { kind: "publish_first" };
  if (input.orders === 0 && input.isProvider && input.activeServices > 0) return { kind: "share_services" };
  if (input.orders === 0) return { kind: "share_toomny" };
  return null;
}

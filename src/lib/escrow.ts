// ---------------------------------------------------------------------------
// Machine à états de la commande et du séquestre.
//
// Les fonds sont retenus chez le partenaire agréé. Nous ne pilotons que les
// transitions : quand demander la rétention, quand libérer, quand rembourser.
// Toute transition non listée ici est un bug, pas un cas à gérer ailleurs.
// ---------------------------------------------------------------------------

export type OrderStatus =
  | "pending_payment"
  | "funded"
  | "in_progress"
  | "delivered"
  | "completed"
  | "disputed"
  | "cancelled"
  | "refunded";

export type PayoutChannel = "wave" | "orange_money" | "mtn_momo" | "moov_money" | "bank_transfer";

/** Canal par défaut : Wave est gratuit à la réception pour le prestataire. */
export const DEFAULT_PAYOUT_CHANNEL: PayoutChannel = "wave";

/** Transitions autorisées. La clé est l'état courant. */
const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending_payment: ["funded", "cancelled"],
  funded: ["in_progress", "refunded", "disputed"],
  in_progress: ["delivered", "disputed"],
  delivered: ["completed", "disputed"],
  completed: [],
  disputed: ["completed", "refunded"],
  cancelled: [],
  refunded: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Transition de commande interdite : ${from} -> ${to}`);
  }
}

/** États dans lesquels les fonds sont retenus chez le partenaire. */
export function isFundsHeld(status: OrderStatus): boolean {
  return status === "funded" || status === "in_progress" || status === "delivered" || status === "disputed";
}

// --- Versements ------------------------------------------------------------
// File manuelle tant que le partenaire n'expose pas de payout automatique :
// l'admin prend en charge (processing), paie hors app puis marque payé (paid).
// Un échec (failed) ne clôt rien : le prestataire peut redemander, ce qui
// crée une NOUVELLE ligne — l'historique est préservé.

export type PayoutStatus = "queued" | "processing" | "paid" | "failed";

const PAYOUT_TRANSITIONS: Record<PayoutStatus, readonly PayoutStatus[]> = {
  queued: ["processing", "failed"],
  processing: ["paid", "failed"],
  failed: ["queued"],
  paid: [],
};

export function canTransitionPayout(from: PayoutStatus, to: PayoutStatus): boolean {
  return (PAYOUT_TRANSITIONS[from] ?? []).includes(to);
}

export function assertPayoutTransition(from: PayoutStatus, to: PayoutStatus): void {
  if (!canTransitionPayout(from, to)) {
    throw new Error(`Transition de versement interdite : ${from} -> ${to}`);
  }
}

/**
 * Délai de validation automatique après livraison. Sans action du client,
 * la commande est validée et le prestataire payé : sinon un client inactif
 * bloque indéfiniment le revenu du prestataire, ce qui est exactement
 * l'irritant que nous prétendons corriger.
 */
export const AUTO_RELEASE_AFTER_DELIVERY_HOURS = 72;

/** Objectif de versement annoncé aux prestataires. */
export const PAYOUT_SLA_HOURS = 24;

/**
 * Date limite de livraison pour la validation automatique : une commande
 * livrée avant cette date et toujours sans action du client est validée
 * d'office par la tâche planifiée (`/api/cron/auto-release`).
 */
export function autoReleaseCutoff(now: Date = new Date()): Date {
  return new Date(now.getTime() - AUTO_RELEASE_AFTER_DELIVERY_HOURS * 3_600_000);
}

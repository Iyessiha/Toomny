// Rappels et expiration des commandes restées en attente de paiement. Fonctions pures.

/** Délai après la création d'une commande avant le rappel de paiement. */
export const PAYMENT_REMINDER_AFTER_HOURS = 24;

/** Délai après la création au-delà duquel une commande non payée est annulée. */
export const PAYMENT_EXPIRY_HOURS = 72;

const HOUR_MS = 60 * 60 * 1000;

export function paymentReminderCutoff(now: Date = new Date()): string {
  return new Date(now.getTime() - PAYMENT_REMINDER_AFTER_HOURS * HOUR_MS).toISOString();
}

export function paymentExpiryCutoff(now: Date = new Date()): string {
  return new Date(now.getTime() - PAYMENT_EXPIRY_HOURS * HOUR_MS).toISOString();
}

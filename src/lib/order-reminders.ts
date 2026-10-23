// Rappels de paiement des commandes restées en attente. Fonction pure.

/** Délai après la création d'une commande avant le rappel de paiement. */
export const PAYMENT_REMINDER_AFTER_HOURS = 24;

export function paymentReminderCutoff(now: Date = new Date()): string {
  return new Date(now.getTime() - PAYMENT_REMINDER_AFTER_HOURS * 60 * 60 * 1000).toISOString();
}

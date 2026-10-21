/**
 * Échéance de livraison au moment du paiement.
 *
 * `due_at` est fixé à la création de la commande, mais le délai de livraison
 * court à partir du financement. Sans recalcul, une commande payée après son
 * échéance initiale serait affichée en retard dès le paiement.
 */
export function fundedDueAt(
  order: { created_at: string; due_at: string | null },
  now: Date,
): string | null {
  if (!order.due_at) return null;
  const deliveryMs = new Date(order.due_at).getTime() - new Date(order.created_at).getTime();
  if (!Number.isFinite(deliveryMs) || deliveryMs <= 0) return null;
  return new Date(now.getTime() + deliveryMs).toISOString();
}

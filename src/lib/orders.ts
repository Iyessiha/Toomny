import { randomUUID } from "node:crypto";

/** Référence lisible par les deux parties, ex. TMY-2026-3F9A2C1B. */
export function orderReference(now: Date = new Date()): string {
  return `TMY-${now.getUTCFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Actions possibles par rôle, avec les états d'origine autorisés. Chaque transition
 * est revalidée par `assertTransition` (lib/escrow.ts) avant écriture.
 */
export const ORDER_RULES = {
  cancel: { role: "client", from: ["pending_payment"], to: "cancelled", label: "Annuler la commande", danger: true },
  start: { role: "provider", from: ["funded"], to: "in_progress", label: "Commencer la mission" },
  deliver: { role: "provider", from: ["in_progress"], to: "delivered", label: "Marquer comme livrée" },
  accept: { role: "client", from: ["delivered"], to: "completed", label: "Valider la livraison" },
  dispute: {
    role: "client",
    from: ["funded", "in_progress", "delivered"],
    to: "disputed",
    label: "Ouvrir un litige",
    danger: true,
    needsReason: true,
  },
} as const;

export type OrderAction = keyof typeof ORDER_RULES;

/** Actions proposées à un utilisateur selon son rôle sur la commande et son statut. */
export function availableActions(isClient: boolean, isProvider: boolean, status: string) {
  return (Object.keys(ORDER_RULES) as OrderAction[]).filter((a) => {
    const rule = ORDER_RULES[a];
    if (!rule.from.includes(status as never)) return false;
    return rule.role === "client" ? isClient : isProvider;
  });
}

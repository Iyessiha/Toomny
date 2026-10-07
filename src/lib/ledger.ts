// ---------------------------------------------------------------------------
// Journal comptable — AJOUT SEUL.
//
// Aucune écriture n'est modifiée ni supprimée. Une correction se fait par une
// écriture inverse de type `adjustment`. Ce journal conditionne les deux
// produits financiers qui porteront la marge réelle : l'attestation de revenus
// et l'avance sur mission. Sans journal propre dès la première transaction,
// ils ne sont pas construisibles plus tard.
// ---------------------------------------------------------------------------

import { db } from "@/db";
import { ledgerEntries } from "@/db/schema";
import type { CurrencyCode } from "@/lib/money";

export type LedgerKind =
  | "order_funded"
  | "commission"
  | "aggregator_fee"
  | "payout"
  | "refund"
  | "adjustment";

export type LedgerDirection = "credit" | "debit";

export type LedgerWrite = {
  orderId?: string;
  profileId?: string;
  kind: LedgerKind;
  direction: LedgerDirection;
  amountMinor: bigint;
  currency: CurrencyCode;
  /** Taux figé au moment de l'opération, jamais recalculé après coup. */
  fxRateToXof?: string;
  externalRef?: string;
  metadata?: Record<string, unknown>;
  occurredAt?: Date;
};

export async function record(entry: LedgerWrite) {
  if (entry.amountMinor <= 0n) {
    throw new Error("Une écriture au journal porte toujours un montant positif ; le sens est donné par `direction`.");
  }

  const [row] = await db
    .insert(ledgerEntries)
    .values({
      orderId: entry.orderId,
      profileId: entry.profileId,
      kind: entry.kind,
      direction: entry.direction,
      amountMinor: entry.amountMinor,
      currency: entry.currency,
      fxRateToXof: entry.fxRateToXof,
      externalRef: entry.externalRef,
      metadata: entry.metadata,
      occurredAt: entry.occurredAt ?? new Date(),
    })
    .returning();

  return row;
}

/** Plusieurs écritures en une transaction : un financement de commande en génère trois. */
export async function recordMany(entries: LedgerWrite[]) {
  if (entries.length === 0) return [];

  return db.transaction(async (tx) => {
    const rows = [];
    for (const entry of entries) {
      if (entry.amountMinor <= 0n) {
        throw new Error("Montant d'écriture invalide.");
      }
      const [row] = await tx
        .insert(ledgerEntries)
        .values({
          orderId: entry.orderId,
          profileId: entry.profileId,
          kind: entry.kind,
          direction: entry.direction,
          amountMinor: entry.amountMinor,
          currency: entry.currency,
          fxRateToXof: entry.fxRateToXof,
          externalRef: entry.externalRef,
          metadata: entry.metadata,
          occurredAt: entry.occurredAt ?? new Date(),
        })
        .returning();
      rows.push(row);
    }
    return rows;
  });
}

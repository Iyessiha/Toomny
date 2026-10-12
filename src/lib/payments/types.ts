// ---------------------------------------------------------------------------
// Contrat d'interface du prestataire de paiement.
//
// Toomny ne détient JAMAIS les fonds (voir l'étude de marché, section
// « Contrainte réglementaire BCEAO » : en UEMOA la détention de fonds du public
// est réservée aux banques, EFP, SFD et EME agréés).
//
// Ce contrat décrit donc ce que fait le PARTENAIRE AGRÉÉ, que nous ne faisons
// qu'orchestrer. Toute implémentation doit se contenter de piloter un flux
// qui ne transite pas par nos comptes.
// ---------------------------------------------------------------------------

import type { CurrencyCode } from "@/lib/money";
import type { PayoutChannel } from "@/lib/escrow";

export type HoldRequest = {
  orderReference: string;
  amountMinor: bigint;
  currency: CurrencyCode;
  payerMsisdn?: string;
  payerEmail?: string;
  /** URL de retour après paiement, côté client. */
  returnUrl: string;
  metadata?: Record<string, string>;
};

export type HoldResult = {
  partner: string;
  partnerHoldRef: string;
  /** Page de paiement du partenaire, vers laquelle rediriger le client. */
  checkoutUrl?: string;
  status: "requested" | "held" | "failed";
  failureReason?: string;
};

export type ReleaseRequest = {
  partnerHoldRef: string;
  /** Montant net prestataire — la commission reste chez nous via le partenaire. */
  amountMinor: bigint;
  currency: CurrencyCode;
  beneficiaryMsisdn: string;
  channel: PayoutChannel;
  metadata?: Record<string, string>;
};

export type ReleaseResult = {
  providerRef: string;
  status: "processing" | "paid" | "failed";
  failureReason?: string;
};

export type RefundRequest = {
  partnerHoldRef: string;
  amountMinor: bigint;
  currency: CurrencyCode;
  reason: string;
};

export type RefundResult = {
  providerRef: string;
  status: "processing" | "paid" | "failed";
  failureReason?: string;
};

export type SubscriptionPaymentRequest = {
  reference: string;
  plan: string;
  amountMinor: bigint;
  currency: CurrencyCode;
  payerMsisdn?: string;
  payerEmail?: string;
  successUrl: string;
  errorUrl: string;
  metadata?: Record<string, string>;
};

export type SubscriptionPaymentResult = {
  partner: string;
  partnerPaymentRef: string;
  checkoutUrl: string;
};

export type WebhookEvent = {
  /** Type normalisé, indépendant du partenaire. */
  type: "hold.held" | "hold.failed" | "payout.paid" | "payout.failed" | "refund.completed";
  partnerHoldRef?: string;
  providerRef?: string;
  amountMinor?: bigint;
  currency?: CurrencyCode;
  occurredAt: Date;
  raw: unknown;
};

/**
 * Tout prestataire de paiement doit implémenter ce contrat. GeniusPay est la
 * première implémentation ; un second partenaire peut être branché sans
 * toucher à la logique de commande.
 */
export interface PaymentProvider {
  readonly name: string;

  /** Demande au partenaire de retenir les fonds du client. */
  createHold(req: HoldRequest): Promise<HoldResult>;

  /** Libère la rétention vers le mobile money du prestataire. */
  releaseHold(req: ReleaseRequest): Promise<ReleaseResult>;

  /** Rend les fonds au client (annulation ou litige tranché en sa faveur). */
  refundHold(req: RefundRequest): Promise<RefundResult>;

  /** Vérifie la signature d'un webhook et le normalise. Lève si invalide. */
  parseWebhook(rawBody: string, signature: string | null, timestamp?: string): WebhookEvent;
}

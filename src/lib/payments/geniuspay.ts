// ---------------------------------------------------------------------------
// GeniusPay — client de l'API marchand.
//
// Base : https://geniuspay.ci/api/v1/merchant
// Doc  : https://geniuspay.ci/docs/api
// Auth : en-têtes X-API-Key + X-API-Secret (clés pk_sandbox_* / pk_live_*)
//
// ⚠️ LIMITE STRUCTURANTE POUR TOOMNY
//
// L'API marchand documentée ne couvre que l'ENCAISSEMENT :
//   POST /payments            créer un paiement (checkout)
//   GET  /payments            lister
//   GET  /payments/{ref}      consulter
//   GET  /account/balance     solde
//
// Elle n'expose AUCUN endpoint de versement (payout / disbursement) ni de
// séquestre. Or une marketplace doit payer ses prestataires : c'est la moitié
// manquante du produit. Les événements webhook `cashout.requested` et
// `cashout.completed` laissent penser que la capacité existe côté GeniusPay
// (qui s'appuie sur PawaPay, lequel sait verser), mais elle n'est pas
// accessible au marchand par l'API publique.
//
// Tant que ce point n'est pas tranché avec GeniusPay, `releaseHold` et
// `refundHold` lèvent volontairement plutôt que de simuler un versement.
// Voir l'étude de marché, section « Contrainte réglementaire BCEAO ».
// ---------------------------------------------------------------------------

import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  PaymentProvider,
  HoldRequest,
  HoldResult,
  ReleaseRequest,
  ReleaseResult,
  RefundRequest,
  RefundResult,
  WebhookEvent,
} from "./types";

const WEBHOOK_TOLERANCE_SECONDS = 300;

const GP_BASE = process.env.GENIUSPAY_API_URL ?? "https://geniuspay.ci/api/v1/merchant";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} manquante : configurez-la dans .env.local.`);
  return value;
}

function headers(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "X-API-Key": requireEnv("GENIUSPAY_API_KEY"),
    "X-API-Secret": requireEnv("GENIUSPAY_SECRET"),
  };
}

/** Format d'erreur GeniusPay : { success:false, error:{ code, message } } */
function parseError(status: number, body: string): string {
  try {
    const j = JSON.parse(body) as { error?: { code?: string; message?: string }; message?: string };
    if (j?.error?.message) return `${j.error.code ?? status} : ${j.error.message}`;
    if (j?.message) return String(j.message);
  } catch {
    // corps non-JSON
  }
  return `HTTP ${status} ${body.slice(0, 200)}`;
}

type PaymentData = {
  reference: string;
  status: "pending" | "processing" | "completed" | "failed" | "expired" | "cancelled";
  checkout_url?: string;
  payment_url?: string;
  amount?: number;
  metadata?: Record<string, string>;
  completed_at?: string | null;
};

export class GeniusPayProvider implements PaymentProvider {
  readonly name = "geniuspay";

  /**
   * Encaissement du client. Le XOF n'ayant pas de subdivision, l'unité mineure
   * est le franc : la conversion vers le montant attendu par l'API est directe.
   * Toute devise à exponent non nul devra être divisée ici.
   */
  async createHold(req: HoldRequest): Promise<HoldResult> {
    const body: Record<string, unknown> = {
      amount: Number(req.amountMinor),
      currency: req.currency,
      description: `Commande ${req.orderReference}`,
      customer: {
        email: req.payerEmail,
        phone: req.payerMsisdn,
      },
      success_url: req.returnUrl,
      error_url: req.returnUrl,
      metadata: {
        app: "toomny",
        kind: "order",
        order_reference: req.orderReference,
        ...req.metadata,
      },
    };

    const res = await fetch(`${GP_BASE}/payments`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    });

    const text = await res.text();
    if (!res.ok) throw new Error(parseError(res.status, text));

    const data = (JSON.parse(text).data ?? {}) as PaymentData;
    const checkoutUrl = data.checkout_url ?? data.payment_url;
    if (!checkoutUrl) throw new Error("Réponse GeniusPay sans URL de paiement.");

    return {
      partner: this.name,
      partnerHoldRef: data.reference,
      checkoutUrl,
      status: data.status === "completed" ? "held" : "requested",
    };
  }

  /** Consultation de l'état d'un paiement. */
  async getPayment(reference: string): Promise<PaymentData> {
    const res = await fetch(`${GP_BASE}/payments/${encodeURIComponent(reference)}`, { headers: headers() });
    const text = await res.text();
    if (!res.ok) throw new Error(parseError(res.status, text));
    return JSON.parse(text).data as PaymentData;
  }

  async releaseHold(_req: ReleaseRequest): Promise<ReleaseResult> {
    throw new Error(
      "Versement impossible : l'API marchand GeniusPay n'expose pas d'endpoint de payout. " +
        "À trancher avec GeniusPay (exposer le cashout) ou brancher un partenaire de " +
        "décaissement agréé. Point bloquant du MVP Toomny.",
    );
  }

  async refundHold(_req: RefundRequest): Promise<RefundResult> {
    throw new Error(
      "Remboursement impossible : aucun endpoint de refund dans l'API marchand GeniusPay. " +
        "Même arbitrage que le versement.",
    );
  }

  /** Signature webhook : HMAC-SHA256(`timestamp.payload`, secret). */
  parseWebhook(rawBody: string, signature: string | null, timestamp?: string): WebhookEvent {
    const secret = requireEnv("GENIUSPAY_WEBHOOK_SECRET");

    if (!signature) throw new Error("Webhook sans signature : rejeté.");
    if (!timestamp) throw new Error("Webhook sans horodatage : rejeté.");

    // Anti-rejeu : une signature valide capturée n'est acceptée que 5 minutes.
    const sentAt = Number(timestamp);
    const nowSec = Date.now() / 1000;
    if (!Number.isFinite(sentAt) || Math.abs(nowSec - sentAt) > WEBHOOK_TOLERANCE_SECONDS) {
      throw new Error("Webhook hors fenêtre temporelle : rejeté.");
    }

    const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
    const a = Buffer.from(signature, "utf8");
    const b = Buffer.from(expected, "utf8");

    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new Error("Signature de webhook invalide : rejeté.");
    }

    const payload = JSON.parse(rawBody) as {
      event?: string;
      data?: { reference?: string; amount?: number; currency?: WebhookEvent["currency"] };
      timestamp?: string;
    };

    const map: Record<string, WebhookEvent["type"]> = {
      "payment.completed": "hold.held",
      "payment.failed": "hold.failed",
      "cashout.completed": "payout.paid",
      "cashout.failed": "payout.failed",
    };

    const type = map[payload.event ?? ""];
    if (!type) throw new Error(`Événement webhook non pris en charge : ${payload.event}`);

    return {
      type,
      partnerHoldRef: payload.data?.reference,
      amountMinor: payload.data?.amount != null ? BigInt(payload.data.amount) : undefined,
      currency: payload.data?.currency,
      occurredAt: payload.timestamp ? new Date(payload.timestamp) : new Date(),
      raw: payload,
    };
  }
}

export const paymentProvider: PaymentProvider = new GeniusPayProvider();

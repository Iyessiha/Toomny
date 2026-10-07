// ---------------------------------------------------------------------------
// GeniusPay — implémentation du contrat PaymentProvider.
//
// Squelette : les appels réels dépendent du contrat signé avec le partenaire
// agréé qui portera la rétention de fonds. Les quatre méthodes sont posées
// pour que la logique de commande puisse être écrite et testée dès maintenant
// contre ce contrat, sans attendre la validation juridique.
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

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} manquante : configurez-la dans .env.local.`);
  return value;
}

export class GeniusPayProvider implements PaymentProvider {
  readonly name = "geniuspay";

  private get baseUrl() {
    return requireEnv("GENIUSPAY_API_URL").replace(/\/$/, "");
  }

  private get apiKey() {
    return requireEnv("GENIUSPAY_API_KEY");
  }

  private async call<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.apiKey}`,
      },
      // Les montants partent en chaîne : JSON.stringify ne sait pas sérialiser un bigint.
      body: JSON.stringify(body, (_k, v) => (typeof v === "bigint" ? v.toString() : v)),
    });

    if (!res.ok) {
      throw new Error(`GeniusPay ${path} a répondu ${res.status} : ${await res.text()}`);
    }

    return (await res.json()) as T;
  }

  async createHold(req: HoldRequest): Promise<HoldResult> {
    // TODO — brancher sur l'endpoint du partenaire agréé une fois le montage validé.
    return this.call<HoldResult>("/holds", req);
  }

  async releaseHold(req: ReleaseRequest): Promise<ReleaseResult> {
    return this.call<ReleaseResult>("/holds/release", req);
  }

  async refundHold(req: RefundRequest): Promise<RefundResult> {
    return this.call<RefundResult>("/holds/refund", req);
  }

  parseWebhook(rawBody: string, signature: string | null): WebhookEvent {
    const secret = requireEnv("GENIUSPAY_WEBHOOK_SECRET");

    if (!signature) throw new Error("Webhook sans signature : rejeté.");

    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signature, "utf8");

    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new Error("Signature de webhook invalide : rejeté.");
    }

    const payload = JSON.parse(rawBody) as {
      type: WebhookEvent["type"];
      hold_ref?: string;
      provider_ref?: string;
      amount_minor?: string;
      currency?: WebhookEvent["currency"];
      occurred_at?: string;
    };

    return {
      type: payload.type,
      partnerHoldRef: payload.hold_ref,
      providerRef: payload.provider_ref,
      amountMinor: payload.amount_minor ? BigInt(payload.amount_minor) : undefined,
      currency: payload.currency,
      occurredAt: payload.occurred_at ? new Date(payload.occurred_at) : new Date(),
      raw: payload,
    };
  }
}

export const paymentProvider: PaymentProvider = new GeniusPayProvider();

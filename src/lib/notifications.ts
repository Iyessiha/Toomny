import type { SupabaseClient } from "@supabase/supabase-js";
import { getNotificationTexts, type NotificationParams } from "@/i18n/notifications";
import type { Locale } from "@/i18n/dictionaries";

export const NOTIFICATION_TYPES = [
  "inquiry_received",
  "inquiry_replied",
  "order_funded",
  "order_payment_failed",
  "order_message",
  "order_started",
  "order_delivered",
  "order_completed",
  "order_cancelled",
  "dispute_opened",
  "dispute_resolved",
  "review_received",
  "verification_approved",
  "verification_rejected",
  "payout_paid",
  "payout_failed",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export function isNotificationType(type: string): type is NotificationType {
  return (NOTIFICATION_TYPES as readonly string[]).includes(type);
}

/**
 * Insère une notification. N'échoue JAMAIS : une notification perdue vaut
 * mieux qu'une commande ou un paiement qui casse à cause d'elle.
 * `db` doit être le client admin (aucune politique INSERT côté RLS).
 */
export async function notify(
  db: SupabaseClient,
  input: {
    recipientId: string;
    type: NotificationType;
    params?: NotificationParams;
    link: string;
  },
): Promise<void> {
  if (!input.link.startsWith("/")) {
    console.error("[notifications] lien interne attendu:", input.link);
    return;
  }
  try {
    const { error } = await db.from("notifications").insert({
      recipient_id: input.recipientId,
      type: input.type,
      params: input.params ?? {},
      link: input.link,
    });
    if (error) console.error("[notifications]", input.type, error.message);
  } catch (err) {
    console.error("[notifications]", input.type, (err as Error).message);
  }
}

const PARAM_KEYS = ["from", "ref", "service", "outcome", "rating", "amount"] as const;

/**
 * Assainit les paramètres lus en base (jsonb non typé) : seules les clés
 * connues et les chaînes survivent. `outcome` est restreint à won/lost.
 */
export function toParams(raw: unknown): NotificationParams {
  if (!raw || typeof raw !== "object") return {};
  const obj = raw as Record<string, unknown>;
  const out: NotificationParams = {};
  for (const key of PARAM_KEYS) {
    const value = obj[key];
    if (typeof value !== "string" || value.length === 0) continue;
    if (key === "outcome" && value !== "won" && value !== "lost") continue;
    (out[key as keyof NotificationParams] as string) = value.slice(0, 200);
  }
  return out;
}

/** Rend le titre et le corps dans la langue du lecteur. Null si type inconnu. */
export function renderNotification(
  type: string,
  params: NotificationParams,
  locale: Locale,
): { title: string; body: string } | null {
  if (!isNotificationType(type)) return null;
  const copy = getNotificationTexts(locale).items[type];
  if (!copy) return null;
  return { title: copy.title, body: copy.body(params) };
}

"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/notifications";
import { formatMoney } from "@/lib/money";
import { assertPayoutTransition, type PayoutStatus } from "@/lib/escrow";
import { UUID_RE } from "@/lib/orders";
import { recordPayout } from "@/lib/order-ledger";
import { recordAdminAction } from "@/lib/admin-audit";
import { getAdminTexts } from "@/i18n/admin";

type Result = { error: string } | { success: true };

function revalidate() {
  revalidatePath("/admin/payouts");
  revalidatePath("/admin");
  // Le prestataire suit ses statuts sur sa page versements.
  revalidatePath("/dashboard/versements");
}

/**
 * Prendre en charge : queued → processing. L'admin s'engage à payer hors app
 * (mobile money) puis à marquer payé. Chaque prise en charge compte un essai.
 */
export async function processPayout(payoutId: string): Promise<Result> {
  const admin = await requireAdmin();
  const e = getAdminTexts(admin.preferredLocale).errors;
  if (!UUID_RE.test(payoutId)) return { error: e.notFound };

  const db = createAdminClient();
  const { data: payout } = await db
    .from("payouts")
    .select("id, status, attempts, order_id")
    .eq("id", payoutId)
    .maybeSingle();
  if (!payout) return { error: e.notFound };

  try {
    assertPayoutTransition(payout.status as PayoutStatus, "processing");
  } catch {
    return { error: e.wrongState };
  }

  const { data: updated, error } = await db
    .from("payouts")
    .update({ status: "processing", attempts: (payout.attempts ?? 0) + 1 })
    .eq("id", payout.id)
    .eq("status", "queued")
    .select("id")
    .maybeSingle();
  if (error || !updated) return { error: e.wrongState };

  await recordAdminAction(db, {
    actorId: admin.id,
    action: "payout.process",
    targetType: "payout",
    targetId: payout.id,
    details: { orderId: payout.order_id },
  });

  revalidate();
  return { success: true };
}

/**
 * Marquer payé : processing → paid, uniquement. Le paiement a été effectué
 * hors app : la référence opérateur, quand elle est renseignée, permet de
 * recouper avec le relevé mobile money. Écrit l'opération au journal.
 */
export async function markPayoutPaid(payoutId: string, providerRef: string): Promise<Result> {
  const admin = await requireAdmin();
  const e = getAdminTexts(admin.preferredLocale).errors;
  if (!UUID_RE.test(payoutId)) return { error: e.notFound };
  const ref = providerRef.trim().slice(0, 120) || null;

  const db = createAdminClient();
  const { data: payout } = await db
    .from("payouts")
    .select("id, status, order_id, provider_id, amount_minor, currency")
    .eq("id", payoutId)
    .maybeSingle();
  if (!payout) return { error: e.notFound };

  try {
    assertPayoutTransition(payout.status as PayoutStatus, "paid");
  } catch {
    return { error: e.wrongState };
  }

  const now = new Date().toISOString();
  const { data: updated, error } = await db
    .from("payouts")
    .update({ status: "paid", provider_ref: ref, paid_at: now, failure_reason: null })
    .eq("id", payout.id)
    .eq("status", "processing")
    .select("id")
    .maybeSingle();
  if (error || !updated) return { error: e.wrongState };

  await recordPayout(db, {
    orderId: payout.order_id,
    providerId: payout.provider_id,
    amountMinor: payout.amount_minor,
    currency: payout.currency,
    providerRef: ref,
  });

  await recordAdminAction(db, {
    actorId: admin.id,
    action: "payout.mark_paid",
    targetType: "payout",
    targetId: payout.id,
    details: {
      orderId: payout.order_id,
      amountMinor: String(payout.amount_minor),
      currency: payout.currency,
      providerRef: ref,
    },
  });

  await notify(db, {
    recipientId: payout.provider_id,
    type: "payout_paid",
    params: {
      amount: formatMoney(BigInt(payout.amount_minor), payout.currency, admin.preferredLocale),
    },
    link: "/dashboard/versements",
  });

  revalidate();
  return { success: true };
}

/**
 * Marquer échoué : queued|processing → failed, avec motif obligatoire. L'échec
 * ne clôt rien : le prestataire peut redemander, ce qui crée une nouvelle
 * ligne — celle-ci reste en historique.
 */
export async function markPayoutFailed(payoutId: string, reason: string): Promise<Result> {
  const admin = await requireAdmin();
  const e = getAdminTexts(admin.preferredLocale).errors;
  if (!UUID_RE.test(payoutId)) return { error: e.notFound };
  const clean = reason.trim();
  if (clean.length < 10 || clean.length > 500) return { error: e.reasonLength };

  const db = createAdminClient();
  const { data: payout } = await db
    .from("payouts")
    .select("id, status, attempts, order_id, provider_id")
    .eq("id", payoutId)
    .maybeSingle();
  if (!payout) return { error: e.notFound };

  try {
    assertPayoutTransition(payout.status as PayoutStatus, "failed");
  } catch {
    return { error: e.wrongState };
  }

  const { data: updated, error } = await db
    .from("payouts")
    .update({
      status: "failed",
      failure_reason: clean,
      attempts: (payout.attempts ?? 0) + 1,
    })
    .eq("id", payout.id)
    .eq("status", payout.status)
    .select("id")
    .maybeSingle();
  if (error || !updated) return { error: e.wrongState };

  await recordAdminAction(db, {
    actorId: admin.id,
    action: "payout.mark_failed",
    targetType: "payout",
    targetId: payout.id,
    details: { orderId: payout.order_id, reason: clean },
  });

  await notify(db, {
    recipientId: payout.provider_id,
    type: "payout_failed",
    link: "/dashboard/versements",
  });

  revalidate();
  return { success: true };
}

/**
 * Remettre en file : failed → queued. Pour un échec transitoire (numéro
 * corrigé, opérateur rétabli) sans attendre une nouvelle demande.
 */
export async function requeuePayout(payoutId: string): Promise<Result> {
  const admin = await requireAdmin();
  const e = getAdminTexts(admin.preferredLocale).errors;
  if (!UUID_RE.test(payoutId)) return { error: e.notFound };

  const db = createAdminClient();
  const { data: payout } = await db
    .from("payouts")
    .select("id, status, order_id")
    .eq("id", payoutId)
    .maybeSingle();
  if (!payout) return { error: e.notFound };

  try {
    assertPayoutTransition(payout.status as PayoutStatus, "queued");
  } catch {
    return { error: e.wrongState };
  }

  const { data: updated, error } = await db
    .from("payouts")
    .update({ status: "queued", failure_reason: null })
    .eq("id", payout.id)
    .eq("status", "failed")
    .select("id")
    .maybeSingle();
  if (error || !updated) return { error: e.wrongState };

  await recordAdminAction(db, {
    actorId: admin.id,
    action: "payout.requeue",
    targetType: "payout",
    targetId: payout.id,
    details: { orderId: payout.order_id },
  });

  revalidate();
  return { success: true };
}

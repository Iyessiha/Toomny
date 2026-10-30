import type { SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "@/i18n/dictionaries";
import { recordFunding } from "@/lib/order-ledger";
import { notify } from "@/lib/notifications";
import { fundedDueAt } from "@/lib/order-deadline";
import { sendPaymentReceiptEmail } from "@/lib/email";
import { loadReceipt, type Receipt } from "@/lib/receipt";

/**
 * Marque le hold `held` puis finance la commande si elle attend encore son paiement.
 * Partagé par le webhook GeniusPay et la vérification demandée par le client, pour
 * que les deux chemins appliquent exactement la même règle.
 * Retourne `true` seulement si cet appel a effectivement financé la commande.
 */
export async function fundOrderFromHold(
  db: SupabaseClient,
  hold: { id: string; order_id: string },
  nowIso: string,
): Promise<boolean> {
  await db.from("escrow_holds").update({ status: "held", held_at: nowIso }).eq("id", hold.id);

  const { data: order } = await db
    .from("orders")
    .select("id, status, reference, client_id, provider_id, amount_minor, currency, created_at, due_at")
    .eq("id", hold.order_id)
    .maybeSingle();

  if (order?.status !== "pending_payment") {
    console.warn("[payments] commande pas en pending_payment:", hold.order_id, order?.status);
    return false;
  }

  // La condition sur le statut garantit qu'un seul des deux chemins finance la commande.
  const { data: funded } = await db
    .from("orders")
    .update({ status: "funded", due_at: fundedDueAt(order, new Date(nowIso)) })
    .eq("id", order.id)
    .eq("status", "pending_payment")
    .select("id")
    .maybeSingle();
  if (!funded) return false;

  await recordFunding(db, order);
  await notifyOrderPaid(db, order.id, order.client_id, order.provider_id, order.reference);

  console.info("[payments] commande financée:", order.id);
  return true;
}

/**
 * Dans l'app, le client et le prestataire reçoivent chacun une notification.
 * Par e-mail, chacun reçoit son message soigné : reçu détaillé pour le client,
 * bouton « Démarrer » pour le prestataire. Le client n'a donc pas de second e-mail générique.
 */
async function notifyOrderPaid(
  db: SupabaseClient,
  orderId: string,
  clientId: string,
  providerId: string,
  reference: string,
): Promise<void> {
  const link = `/orders/${orderId}`;
  const params = { ref: reference };

  await notify(db, { recipientId: clientId, type: "order_payment_confirmed", params, link, sendEmail: false });
  await notify(db, { recipientId: providerId, type: "order_funded", params, link, sendEmail: false });

  await sendPaymentEmails(db, orderId);
}

async function sendReceiptTo(
  db: SupabaseClient,
  userId: string,
  audience: "client" | "provider",
  receipt: Receipt,
): Promise<void> {
  try {
    const { data } = await db.auth.admin.getUserById(userId);
    const user = data?.user;
    if (!user?.email) return;
    const meta = user.user_metadata as Record<string, unknown>;
    const firstName = typeof meta?.first_name === "string" ? meta.first_name : "vous";
    const locale: Locale = meta?.preferred_locale === "en" ? "en" : "fr";
    await sendPaymentReceiptEmail({ to: user.email, audience, firstName, receipt, locale });
  } catch (err) {
    console.error("[payments:receipt]", audience, (err as Error).message);
  }
}

/**
 * Envoie (ou renvoie) les e-mails de paiement confirmé : reçu pour le client, commande
 * payée pour le prestataire. Sert aussi au renvoi manuel depuis l'administration.
 */
export async function sendPaymentEmails(db: SupabaseClient, orderId: string): Promise<boolean> {
  const { data: order } = await db
    .from("orders")
    .select("client_id, provider_id")
    .eq("id", orderId)
    .maybeSingle();
  const receipt = await loadReceipt(db, orderId);
  if (!order || !receipt) return false;

  await sendReceiptTo(db, order.client_id, "client", receipt);
  await sendReceiptTo(db, order.provider_id, "provider", receipt);
  return true;
}

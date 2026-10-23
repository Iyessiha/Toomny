import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { paymentProvider } from "@/lib/payments/geniuspay";
import { isSupportedCurrency } from "@/lib/money";
import { UUID_RE } from "@/lib/orders";

/** Une page de paiement encore récente est réutilisée : pas de seconde demande pour un même clic répété. */
const CHECKOUT_REUSE_MS = 30 * 60 * 1000;

export async function POST(request: Request): Promise<Response> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let orderId: string;
  try {
    const body = (await request.json()) as { orderId?: string };
    if (!body.orderId || !UUID_RE.test(body.orderId)) throw new Error("orderId invalide");
    orderId = body.orderId;
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const db = createAdminClient();

  const { data: order } = await db
    .from("orders")
    .select("id, reference, status, amount_minor, client_charge_minor, currency, client_id")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }
  if (order.client_id !== user.id) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  if (order.status !== "pending_payment") {
    return NextResponse.json({ error: "Paiement non attendu pour cette commande" }, { status: 409 });
  }
  if (!isSupportedCurrency(order.currency)) {
    console.error("[payments:initiate] devise non prise en charge:", order.currency, order.id);
    return NextResponse.json({ error: "Devise non prise en charge" }, { status: 422 });
  }

  // Idempotence : un double-clic ou un rafraîchissement ne doit pas créer deux
  // rétentions. Une tentative `requested` antérieure est périmée avant d'en
  // créer une nouvelle ; un paiement déjà confirmé bloque tout nouvel essai.
  const { data: existingHolds } = await db
    .from("escrow_holds")
    .select("id, status, checkout_url, created_at")
    .eq("order_id", orderId)
    .in("status", ["requested", "held"]);
  if (existingHolds?.some((h) => h.status === "held")) {
    return NextResponse.json(
      { error: "Paiement déjà confirmé, en cours de traitement" },
      { status: 409 },
    );
  }
  const reusable = existingHolds?.find(
    (h) =>
      h.status === "requested" &&
      h.checkout_url &&
      Date.now() - new Date(h.created_at).getTime() < CHECKOUT_REUSE_MS,
  );
  if (reusable?.checkout_url) {
    return NextResponse.json({ checkoutUrl: reusable.checkout_url });
  }

  if (existingHolds && existingHolds.length > 0) {
    await db
      .from("escrow_holds")
      .update({ status: "failed", failure_reason: "Tentative remplacée par un nouvel essai de paiement" })
      .eq("order_id", orderId)
      .eq("status", "requested");
  }

  const { data: profile } = await db
    .from("profiles")
    .select("email, phone")
    .eq("id", user.id)
    .maybeSingle();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const returnUrl = `${appUrl}/orders/${orderId}`;

  let holdResult;
  try {
    // client_charge_minor = prix service + frais GeniusPay collect (à la charge du client).
    // Pour les commandes créées avant la migration 0028, fallback sur amount_minor.
    const chargeMinor = order.client_charge_minor
      ? BigInt(order.client_charge_minor)
      : BigInt(order.amount_minor);

    holdResult = await paymentProvider.createHold({
      orderReference: order.reference,
      amountMinor: chargeMinor,
      currency: order.currency,
      payerEmail: profile?.email ?? undefined,
      payerMsisdn: profile?.phone ?? undefined,
      returnUrl,
      metadata: { order_id: orderId },
    });
  } catch (err) {
    console.error("[payments:initiate] createHold échoué:", (err as Error).message);
    return NextResponse.json({ error: "Erreur de paiement" }, { status: 502 });
  }

  await db.from("escrow_holds").insert({
    order_id: orderId,
    partner: holdResult.partner,
    partner_hold_ref: holdResult.partnerHoldRef,
    status: holdResult.status,
    checkout_url: holdResult.checkoutUrl ?? null,
    amount_minor: order.client_charge_minor ?? order.amount_minor,
    currency: order.currency,
  });

  if (!holdResult.checkoutUrl) {
    return NextResponse.json({ error: "URL de paiement manquante" }, { status: 502 });
  }

  return NextResponse.json({ checkoutUrl: holdResult.checkoutUrl });
}

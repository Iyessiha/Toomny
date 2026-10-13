import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { paymentProvider } from "@/lib/payments/geniuspay";
import { UUID_RE } from "@/lib/orders";

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
    .select("id, reference, status, amount_minor, currency, client_id")
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

  const { data: profile } = await db
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .maybeSingle();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const returnUrl = `${appUrl}/orders/${orderId}`;

  let holdResult;
  try {
    holdResult = await paymentProvider.createHold({
      orderReference: order.reference,
      amountMinor: BigInt(order.amount_minor),
      currency: order.currency as "XOF",
      payerEmail: profile?.email ?? undefined,
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
    amount_minor: order.amount_minor,
    currency: order.currency,
  });

  if (!holdResult.checkoutUrl) {
    return NextResponse.json({ error: "URL de paiement manquante" }, { status: 502 });
  }

  return NextResponse.json({ checkoutUrl: holdResult.checkoutUrl });
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isProvider, type UserRole } from "@/lib/auth";
import { paymentProvider } from "@/lib/payments/geniuspay";
import {
  PLANS,
  isPaidPlanTier,
  subscriptionReference,
  type PaidPlanTier,
} from "@/lib/plans";

export async function POST(request: Request): Promise<Response> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let requestedPlan: unknown;
  try {
    const body = (await request.json()) as { plan?: unknown };
    requestedPlan = body.plan;
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  if (!isPaidPlanTier(requestedPlan)) {
    return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
  }
  const plan: PaidPlanTier = requestedPlan;

  const db = createAdminClient();
  const { data: profile } = await db
    .from("profiles")
    .select("id, email, phone, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !isProvider(profile.role as UserRole)) {
    return NextResponse.json({ error: "Réservé aux comptes prestataires" }, { status: 403 });
  }

  // Montant déterminé côté serveur à partir de la grille officielle.
  const spec = PLANS[plan];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const reference = subscriptionReference();

  // 1. Ligne « en attente » créée avant la session : sans elle, un paiement réussi
  //    ne pourrait jamais être rattaché et activé par le webhook.
  const { data: pending, error: pendingError } = await db
    .from("subscriptions")
    .insert({
      provider_id: user.id,
      plan: spec.tier,
      amount_minor: spec.priceMinor.toString(),
      currency: spec.currency,
      status: "pending",
      partner: paymentProvider.name,
      partner_payment_ref: reference,
    })
    .select("id")
    .single();

  if (pendingError || !pending) {
    console.error("[subscriptions:checkout] insert:", pendingError?.message);
    return NextResponse.json({ error: "Impossible d'enregistrer l'abonnement" }, { status: 500 });
  }

  // 2. Session chez le fournisseur.
  let paymentResult;
  try {
    paymentResult = await paymentProvider.createSubscriptionPayment({
      reference,
      plan: spec.tier,
      amountMinor: spec.priceMinor,
      currency: spec.currency,
      payerEmail: profile.email ?? user.email ?? undefined,
      payerMsisdn: profile.phone ?? undefined,
      successUrl: `${appUrl}/dashboard/plan?payment=success`,
      errorUrl: `${appUrl}/dashboard/plan?payment=error`,
      metadata: {
        provider_id: user.id,
        plan: spec.tier,
      },
    });
  } catch (err) {
    console.error("[subscriptions:checkout] createSubscriptionPayment échoué:", (err as Error).message);
    await db.from("subscriptions").delete().eq("id", pending.id);
    return NextResponse.json({ error: "Erreur de paiement" }, { status: 502 });
  }

  // 3. La référence réelle du fournisseur est enregistrée avant de rendre l'URL de paiement.
  //    Sans cela, le webhook ne retrouverait pas la ligne. Si l'écriture échoue, le client
  //    ne reçoit pas d'URL et la session ne peut pas être payée.
  const { error: refError } = await db
    .from("subscriptions")
    .update({ partner_payment_ref: paymentResult.partnerPaymentRef })
    .eq("id", pending.id);

  if (refError) {
    console.error("[subscriptions:checkout] ref:", refError.message);
    await db.from("subscriptions").delete().eq("id", pending.id);
    return NextResponse.json({ error: "Impossible d'enregistrer l'abonnement" }, { status: 500 });
  }

  return NextResponse.json({ checkoutUrl: paymentResult.checkoutUrl });
}

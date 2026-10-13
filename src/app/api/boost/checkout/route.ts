import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isProvider, type UserRole } from "@/lib/auth";
import { paymentProvider } from "@/lib/payments/geniuspay";
import { BOOSTS, isBoostTier, boostReference, type BoostTier } from "@/lib/boost";

export async function POST(request: Request): Promise<Response> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let tier: unknown;
  try {
    const body = (await request.json()) as { tier?: unknown };
    tier = body.tier;
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  if (!isBoostTier(tier)) {
    return NextResponse.json({ error: "Offre Boost invalide" }, { status: 400 });
  }
  const boostTier: BoostTier = tier;
  const spec = BOOSTS[boostTier];

  const db = createAdminClient();
  const { data: profile } = await db
    .from("profiles")
    .select("id, email, phone, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !isProvider(profile.role as UserRole)) {
    return NextResponse.json({ error: "Réservé aux comptes prestataires" }, { status: 403 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const reference = boostReference();

  let paymentResult;
  try {
    paymentResult = await paymentProvider.createSubscriptionPayment({
      reference,
      plan: `boost_${spec.tier}`,
      amountMinor: spec.priceMinor,
      currency: spec.currency,
      payerEmail: profile.email ?? user.email ?? undefined,
      payerMsisdn: profile.phone ?? undefined,
      successUrl: `${appUrl}/dashboard/boost?payment=success`,
      errorUrl: `${appUrl}/dashboard/boost?payment=error`,
      metadata: {
        provider_id: user.id,
        boost_tier: spec.tier,
      },
    });
  } catch (err) {
    console.error("[boost:checkout]", (err as Error).message);
    return NextResponse.json({ error: "Erreur de paiement" }, { status: 502 });
  }

  const { error: insertError } = await db.from("boosts").insert({
    provider_id: user.id,
    tier: spec.tier,
    amount_minor: spec.priceMinor.toString(),
    currency: spec.currency,
    status: "pending",
    partner: paymentResult.partner,
    partner_payment_ref: paymentResult.partnerPaymentRef,
  });

  if (insertError) {
    console.error("[boost:checkout] insert:", insertError.message);
    return NextResponse.json({ error: "Impossible d'enregistrer le boost" }, { status: 500 });
  }

  return NextResponse.json({ checkoutUrl: paymentResult.checkoutUrl });
}

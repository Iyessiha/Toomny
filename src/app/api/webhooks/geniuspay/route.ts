import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { paymentProvider } from "@/lib/payments/geniuspay";
import { recordFunding } from "@/lib/order-ledger";
import { notify } from "@/lib/notifications";
import { nextPeriodEnd } from "@/lib/plans";
import { BOOST_PERIOD_MS } from "@/lib/boost";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const rawBody = await request.text();
  const signature = request.headers.get("x-geniuspay-signature");
  const timestamp = request.headers.get("x-geniuspay-timestamp") ?? undefined;

  let event;
  try {
    event = paymentProvider.parseWebhook(rawBody, signature, timestamp);
  } catch (err) {
    console.error("[webhook:geniuspay] rejeté:", (err as Error).message);
    return NextResponse.json({ ok: false, error: "signature invalide" }, { status: 400 });
  }

  if (event.type === "hold.held" && event.partnerHoldRef) {
    const db = createAdminClient();
    const nowDate = new Date();
    const now = nowDate.toISOString();

    const { data: hold } = await db
      .from("escrow_holds")
      .select("id, order_id, status")
      .eq("partner", "geniuspay")
      .eq("partner_hold_ref", event.partnerHoldRef)
      .maybeSingle();

    if (!hold) {
      // Référence absente d'escrow_holds : vérifier s'il s'agit d'un abonnement.
      const { data: sub } = await db
        .from("subscriptions")
        .select("id, provider_id, plan, status")
        .eq("partner", "geniuspay")
        .eq("partner_payment_ref", event.partnerHoldRef)
        .maybeSingle();

      if (!sub) {
        // Vérifier si c'est un boost.
        const { data: boost } = await db
          .from("boosts")
          .select("id, provider_id, tier, status")
          .eq("partner", "geniuspay")
          .eq("partner_payment_ref", event.partnerHoldRef)
          .maybeSingle();

        if (!boost) {
          console.error("[webhook:geniuspay] rétention, abonnement ou boost introuvable:", event.partnerHoldRef);
          return NextResponse.json({ ok: true });
        }

        if (boost.status === "active") return NextResponse.json({ ok: true });

        const periodEnd = new Date(nowDate.getTime() + BOOST_PERIOD_MS).toISOString();

        await db
          .from("boosts")
          .update({ status: "active", period_start: now, period_end: periodEnd })
          .eq("id", boost.id);

        await notify(db, {
          recipientId: boost.provider_id,
          type: "boost_activated",
          params: { plan: boost.tier },
          link: "/dashboard/boost",
        });

        console.info("[webhook:geniuspay] boost activé:", boost.id, boost.tier);
        return NextResponse.json({ ok: true });
      }

      if (sub.status === "active") {
        return NextResponse.json({ ok: true });
      }

      const periodEnd = nextPeriodEnd(nowDate).toISOString();

      await db
        .from("subscriptions")
        .update({ status: "expired" })
        .eq("provider_id", sub.provider_id)
        .eq("status", "active")
        .neq("id", sub.id);

      await db
        .from("subscriptions")
        .update({
          status: "active",
          period_start: now,
          period_end: periodEnd,
        })
        .eq("id", sub.id);

      await db
        .from("provider_profiles")
        .upsert(
          {
            profile_id: sub.provider_id,
            plan: sub.plan,
            plan_expires_at: periodEnd,
          },
          { onConflict: "profile_id" },
        );

      await notify(db, {
        recipientId: sub.provider_id,
        type: "subscription_activated",
        params: { plan: sub.plan },
        link: "/dashboard/plan",
      });

      console.info("[webhook:geniuspay] abonnement activé:", sub.id, sub.plan);
      return NextResponse.json({ ok: true });
    }

    if (hold.status === "held") {
      return NextResponse.json({ ok: true });
    }

    await db
      .from("escrow_holds")
      .update({ status: "held", held_at: now })
      .eq("id", hold.id);

    const { data: order } = await db
      .from("orders")
      .select("id, status, reference, client_id, provider_id, amount_minor, currency")
      .eq("id", hold.order_id)
      .maybeSingle();

    if (order?.status === "pending_payment") {
      await db
        .from("orders")
        .update({ status: "funded" })
        .eq("id", order.id)
        .eq("status", "pending_payment");

      await recordFunding(db, order);

      await notify(db, {
        recipientId: order.provider_id,
        type: "order_funded",
        params: { ref: order.reference },
        link: `/orders/${order.id}`,
      });

      console.info("[webhook:geniuspay] commande financée:", order.id);
    } else {
      console.warn("[webhook:geniuspay] commande pas en pending_payment:", hold.order_id, order?.status);
    }
  }

  if (event.type === "hold.failed" && event.partnerHoldRef) {
    const db = createAdminClient();
    await db
      .from("escrow_holds")
      .update({ status: "failed", failure_reason: "Paiement refusé par GeniusPay" })
      .eq("partner", "geniuspay")
      .eq("partner_hold_ref", event.partnerHoldRef);

    const { data: failedHold } = await db
      .from("escrow_holds")
      .select("order_id")
      .eq("partner", "geniuspay")
      .eq("partner_hold_ref", event.partnerHoldRef)
      .maybeSingle();
    if (failedHold) {
      const { data: failedOrder } = await db
        .from("orders")
        .select("id, reference, client_id")
        .eq("id", failedHold.order_id)
        .maybeSingle();
      if (failedOrder) {
        await notify(db, {
          recipientId: failedOrder.client_id,
          type: "order_payment_failed",
          params: { ref: failedOrder.reference },
          link: `/orders/${failedOrder.id}`,
        });
      }
    } else {
      const { data: failedSub } = await db
        .from("subscriptions")
        .select("id, provider_id, plan, status")
        .eq("partner", "geniuspay")
        .eq("partner_payment_ref", event.partnerHoldRef)
        .maybeSingle();
      if (failedSub && failedSub.status !== "active") {
        await db
          .from("subscriptions")
          .update({ status: "failed" })
          .eq("id", failedSub.id);
        await notify(db, {
          recipientId: failedSub.provider_id,
          type: "subscription_failed",
          params: { plan: failedSub.plan },
          link: "/dashboard/plan",
        });
      } else if (!failedSub) {
        const { data: failedBoost } = await db
          .from("boosts")
          .select("id, provider_id, tier")
          .eq("partner", "geniuspay")
          .eq("partner_payment_ref", event.partnerHoldRef)
          .maybeSingle();
        if (failedBoost) {
          await db.from("boosts").update({ status: "failed" }).eq("id", failedBoost.id);
          await notify(db, {
            recipientId: failedBoost.provider_id,
            type: "boost_failed",
            params: { plan: failedBoost.tier },
            link: "/dashboard/boost",
          });
        }
      }
    }

    console.info("[webhook:geniuspay] hold.failed:", event.partnerHoldRef);
  }

  return NextResponse.json({ ok: true });
}

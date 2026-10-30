"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertTransition, type OrderStatus } from "@/lib/escrow";
import { splitOrderAmount } from "@/lib/money";
import { ORDER_RULES, UUID_RE, orderReference, type OrderAction } from "@/lib/orders";
import { commissionBpsForPlan, hasPaidPlan } from "@/lib/plans";
import { MAX_ADDONS_PER_SERVICE, orderTotals } from "@/lib/service-addons";
import { getAddonTexts } from "@/i18n/addons";
import { getDashboardTexts } from "@/i18n/dashboard";
import { getMarketplaceTexts } from "@/i18n/marketplace";
import { recordCompletion, refreshProviderRating } from "@/lib/order-ledger";
import { notify } from "@/lib/notifications";
import { actorName } from "@/lib/names";
import { confirmOrderPayment, type PaymentCheck } from "@/lib/payments/confirm-order-payment";

type Result = { error: string } | { success: true; orderId?: string };

/**
 * Le client demande à Toomny de vérifier son paiement auprès de GeniusPay, sans attendre le webhook.
 */
export async function checkOrderPayment(orderId: string): Promise<{ status: PaymentCheck | "error" }> {
  const user = await requireAuth();
  if (!UUID_RE.test(orderId)) return { status: "error" };

  try {
    const status = await confirmOrderPayment(orderId, user.id);
    revalidatePath(`/orders/${orderId}`);
    return { status };
  } catch (err) {
    console.error("[orders:checkPayment]", (err as Error).message);
    return { status: "error" };
  }
}

/**
 * Commander une prestation. La commande est figée au prix du moment (montants
 * recalculés ici, jamais repris du formulaire). Elle démarre en `pending_payment`.
 */
export async function createOrder(input: {
  serviceId: string;
  requirements: string;
  packageId?: string;
  addonIds?: string[];
}): Promise<Result> {
  const user = await requireAuth();
  const e = getDashboardTexts(user.preferredLocale).orders.errors;

  if (!UUID_RE.test(input.serviceId)) return { error: e.notFound };
  if (input.packageId && !UUID_RE.test(input.packageId)) return { error: e.notFound };
  const requirements = (input.requirements ?? "").trim();
  if (requirements.length > 2000) {
    return { error: e.createRange };
  }

  const db = createAdminClient();
  const { data: service } = await db
    .from("services")
    .select("id, provider_id, price_minor, currency, delivery_days, status")
    .eq("id", input.serviceId)
    .maybeSingle();

  if (!service || service.status !== "active") return { error: e.unavailable };
  if (service.provider_id === user.id) return { error: e.own };

  // Si un forfait est sélectionné, on utilise ses prix/délai
  let priceMinor = BigInt(service.price_minor);
  let deliveryDays = service.delivery_days;
  let packageId: string | null = null;

  if (input.packageId) {
    const { data: pkg } = await db
      .from("service_packages")
      .select("id, price_minor, delivery_days")
      .eq("id", input.packageId)
      .eq("service_id", input.serviceId)
      .maybeSingle();
    if (!pkg) return { error: e.notFound };
    priceMinor = BigInt(pkg.price_minor);
    deliveryDays = pkg.delivery_days;
    packageId = pkg.id;
  }

  const { data: providerProfile } = await db
    .from("provider_profiles")
    .select("plan, plan_expires_at")
    .eq("profile_id", service.provider_id)
    .maybeSingle();

  const now = new Date();
  const commissionBps = commissionBpsForPlan(
    providerProfile?.plan,
    providerProfile?.plan_expires_at ?? null,
    now,
  );
  // Suppléments : seuls ceux, actifs, de cette prestation comptent, et seulement si le prestataire est payant.
  const addonIds = [...new Set(input.addonIds ?? [])];
  if (addonIds.length > MAX_ADDONS_PER_SERVICE) return { error: e.notFound };
  if (addonIds.some((id) => !UUID_RE.test(id))) return { error: e.notFound };

  let chosenAddons: { id: string; title: string; price_minor: number | string; extra_delivery_days: number }[] = [];
  if (addonIds.length > 0) {
    if (!hasPaidPlan(providerProfile?.plan, providerProfile?.plan_expires_at ?? null, now)) {
      return { error: getAddonTexts(user.preferredLocale).errors.locked };
    }
    const { data: addonRows } = await db
      .from("service_addons")
      .select("id, title, price_minor, extra_delivery_days")
      .eq("service_id", service.id)
      .eq("active", true)
      .in("id", addonIds);
    if (!addonRows || addonRows.length !== addonIds.length) return { error: e.notFound };
    chosenAddons = addonRows;
    const totals = orderTotals(priceMinor, deliveryDays, chosenAddons);
    priceMinor = totals.priceMinor;
    deliveryDays = totals.deliveryDays;
  }

  const split = splitOrderAmount(priceMinor, commissionBps);

  const { data: order, error } = await db
    .from("orders")
    .insert({
      reference: orderReference(now),
      service_id: service.id,
      client_id: user.id,
      provider_id: service.provider_id,
      status: "pending_payment",
      amount_minor: split.amountMinor.toString(),
      collect_fee_minor: split.collectFeeMinor.toString(),
      client_charge_minor: split.clientChargeMinor.toString(),
      commission_minor: split.commissionMinor.toString(),
      payout_fee_minor: split.payoutFeeMinor.toString(),
      provider_net_minor: split.providerNetMinor.toString(),
      currency: service.currency,
      commission_rate_bps: split.commissionRateBps,
      requirements,
      due_at: new Date(now.getTime() + deliveryDays * 86_400_000).toISOString(),
      ...(packageId ? { package_id: packageId } : {}),
    })
    .select("id")
    .single();

  if (error || !order) return { error: e.create };

  if (chosenAddons.length > 0) {
    const { error: addonError } = await db.from("order_addons").insert(
      chosenAddons.map((a) => ({
        order_id: order.id,
        addon_id: a.id,
        title: a.title,
        price_minor: BigInt(a.price_minor).toString(),
        extra_delivery_days: a.extra_delivery_days,
      })),
    );
    if (addonError) {
      // Une commande sans ses suppléments serait fausse : on l'annule plutôt que de la laisser.
      console.error("createOrder addons:", addonError.message);
      await db.from("orders").delete().eq("id", order.id);
      return { error: e.create };
    }
  }

  revalidatePath("/orders");
  return { success: true, orderId: order.id };
}

/**
 * Faire avancer une commande. Chaque action vérifie le rôle de l'appelant sur cette
 * commande, puis la transition, puis met à jour seulement si l'état n'a pas changé
 * entre-temps (verrou optimiste).
 */
export async function advanceOrder(input: {
  orderId: string;
  action: OrderAction;
  reason?: string;
}): Promise<Result> {
  const user = await requireAuth();
  const e = getDashboardTexts(user.preferredLocale).orders.errors;

  const rule = ORDER_RULES[input.action];
  if (!rule || !UUID_RE.test(input.orderId)) return { error: e.unknownAction };

  const db = createAdminClient();
  const { data: order } = await db
    .from("orders")
    .select("id, status, reference, client_id, provider_id")
    .eq("id", input.orderId)
    .maybeSingle();

  if (!order) return { error: e.notFound };

  const allowed = rule.role === "client" ? order.client_id === user.id : order.provider_id === user.id;
  if (!allowed) return { error: e.notAllowed };
  if (!(rule.from as readonly string[]).includes(order.status)) {
    return { error: e.wrongState };
  }

  try {
    assertTransition(order.status as OrderStatus, rule.to as OrderStatus);
  } catch {
    return { error: e.transition };
  }

  let reason: string | null = null;
  if ("needsReason" in rule && rule.needsReason) {
    reason = (input.reason ?? "").trim();
    if (reason.length < 20 || reason.length > 2000) {
      return { error: e.disputeLength };
    }
  }

  const now = new Date().toISOString();
  const patch: Record<string, string> = { status: rule.to, updated_at: now };
  if (rule.to === "delivered") patch.delivered_at = now;
  if (rule.to === "completed") patch.completed_at = now;

  const { data: updated, error } = await db
    .from("orders")
    .update(patch)
    .eq("id", order.id)
    .eq("status", order.status)
    .select("id")
    .maybeSingle();

  if (error || !updated) return { error: e.changed };

  if (reason) {
    const { error: disputeErr } = await db.from("disputes").insert({
      order_id: order.id,
      opened_by: user.id,
      reason,
      status: "open",
    });
    if (disputeErr) console.error("advanceOrder dispute:", disputeErr.message);
  }

  if (rule.to === "completed") await recordCompletion(db, order.id, order.provider_id);

  // Chaque transition prévient l'autre partie (jamais l'acteur lui-même).
  if (rule.to === "in_progress" || rule.to === "delivered") {
    await notify(db, {
      recipientId: order.client_id,
      type: rule.to === "delivered" ? "order_delivered" : "order_started",
      params: { ref: order.reference },
      link: `/orders/${order.id}`,
    });
  } else if (rule.to === "completed" || rule.to === "cancelled") {
    await notify(db, {
      recipientId: order.provider_id,
      type: rule.to === "completed" ? "order_completed" : "order_cancelled",
      params: { ref: order.reference },
      link: `/orders/${order.id}`,
    });
  } else if (rule.to === "disputed") {
    await notify(db, {
      recipientId: order.provider_id,
      type: "dispute_opened",
      params: { ref: order.reference },
      link: "/disputes",
    });
  }

  revalidatePath(`/orders/${order.id}`);
  revalidatePath("/orders");
  return { success: true };
}

/** Message dans le fil d'une commande. La politique RLS n'autorise que les parties concernées. */
export async function sendMessage(input: {
  orderId: string;
  body: string;
  attachmentPath?: string;
}): Promise<Result> {
  const user = await requireAuth();
  const e = getDashboardTexts(user.preferredLocale).orders.errors;
  const t = getDashboardTexts(user.preferredLocale).orders;
  const body = input.body.trim();

  if (!UUID_RE.test(input.orderId)) return { error: e.notFound };
  if (body.length < 1 || body.length > 2000) return { error: t.messageLength };

  const supabase = await createClient();
  const { error } = await supabase.from("messages").insert({
    order_id: input.orderId,
    sender_id: user.id,
    body,
    ...(input.attachmentPath ? { attachment_path: input.attachmentPath } : {}),
  });
  if (error) return { error: t.sendError };

  const { data: order } = await supabase
    .from("orders")
    .select("client_id, provider_id, reference")
    .eq("id", input.orderId)
    .maybeSingle();
  if (order) {
    const otherId = order.client_id === user.id ? order.provider_id : order.client_id;
    await notify(createAdminClient(), {
      recipientId: otherId,
      type: "order_message",
      params: { from: await actorName(user.id, user.preferredLocale), ref: order.reference },
      link: `/orders/${input.orderId}`,
    });
  }

  revalidatePath(`/orders/${input.orderId}`);
  return { success: true };
}

/**
 * Avis du client sur une commande terminée. Un seul avis par commande (contrainte
 * unique en base). La note moyenne du prestataire est recalculée ensuite.
 */
export async function submitReview(input: { orderId: string; rating: number; comment: string }): Promise<Result> {
  const user = await requireAuth();
  const t = getMarketplaceTexts(user.preferredLocale).review.errors;

  if (!UUID_RE.test(input.orderId)) return { error: t.notAllowed };
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) return { error: t.rating };
  const comment = input.comment.trim();
  if (comment.length > 1000) return { error: t.comment };

  const db = createAdminClient();
  const { data: order } = await db
    .from("orders")
    .select("id, status, reference, client_id, provider_id")
    .eq("id", input.orderId)
    .maybeSingle();
  if (!order || order.client_id !== user.id) return { error: t.notAllowed };
  if (order.status !== "completed") return { error: t.wrongState };

  const { error } = await db.from("reviews").insert({
    order_id: order.id,
    author_id: user.id,
    target_id: order.provider_id,
    rating: input.rating,
    comment: comment || null,
  });
  if (error) return { error: error.code === "23505" ? t.already : t.save };

  await refreshProviderRating(db, order.provider_id);

  await notify(db, {
    recipientId: order.provider_id,
    type: "review_received",
    params: { ref: order.reference, rating: String(input.rating) },
    link: `/orders/${order.id}`,
  });

  revalidatePath(`/orders/${order.id}`);
  revalidatePath(`/prestataires/${order.provider_id}`);
  return { success: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertTransition, type OrderStatus } from "@/lib/escrow";
import { DEFAULT_COMMISSION_BPS, splitOrderAmount } from "@/lib/money";
import { ORDER_RULES, UUID_RE, orderReference, type OrderAction } from "@/lib/orders";
import { getDashboardTexts } from "@/i18n/dashboard";
import { getMarketplaceTexts } from "@/i18n/marketplace";
import { recordCompletion, refreshProviderRating } from "@/lib/order-ledger";

type Result = { error: string } | { success: true; orderId?: string };

/**
 * Commander une prestation. La commande est figée au prix du moment (montants
 * recalculés ici, jamais repris du formulaire). Elle démarre en `pending_payment`.
 */
export async function createOrder(input: { serviceId: string; requirements: string; packageId?: string }): Promise<Result> {
  const user = await requireAuth();
  const e = getDashboardTexts(user.preferredLocale).orders.errors;

  if (!UUID_RE.test(input.serviceId)) return { error: e.notFound };
  if (input.packageId && !UUID_RE.test(input.packageId)) return { error: e.notFound };
  const requirements = input.requirements.trim();
  if (requirements.length < 10 || requirements.length > 2000) {
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

  const now = new Date();
  const split = splitOrderAmount(priceMinor, DEFAULT_COMMISSION_BPS);

  const { data: order, error } = await db
    .from("orders")
    .insert({
      reference: orderReference(now),
      service_id: service.id,
      client_id: user.id,
      provider_id: service.provider_id,
      status: "pending_payment",
      amount_minor: split.amountMinor.toString(),
      commission_minor: split.commissionMinor.toString(),
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
    .select("id, status, client_id, provider_id")
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

  revalidatePath(`/orders/${order.id}`);
  revalidatePath("/orders");
  return { success: true };
}

/** Message dans le fil d'une commande. La politique RLS n'autorise que les parties concernées. */
export async function sendMessage(input: { orderId: string; body: string }): Promise<Result> {
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
  });
  if (error) return { error: t.sendError };

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
    .select("id, status, client_id, provider_id")
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
  revalidatePath(`/orders/${order.id}`);
  revalidatePath(`/prestataires/${order.provider_id}`);
  return { success: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertTransition, type OrderStatus } from "@/lib/escrow";
import { DEFAULT_COMMISSION_BPS, splitOrderAmount } from "@/lib/money";
import { ORDER_RULES, UUID_RE, orderReference, type OrderAction } from "@/lib/orders";

type Result = { error: string } | { success: true; orderId?: string };

/**
 * Commander une prestation. La commande est figée au prix du moment (montants
 * recalculés ici, jamais repris du formulaire). Elle démarre en `pending_payment`.
 */
export async function createOrder(input: { serviceId: string; requirements: string }): Promise<Result> {
  const user = await requireAuth();

  if (!UUID_RE.test(input.serviceId)) return { error: "Prestation introuvable." };
  const requirements = input.requirements.trim();
  if (requirements.length < 10 || requirements.length > 2000) {
    return { error: "Décrivez votre besoin en 10 à 2000 caractères." };
  }

  const db = createAdminClient();
  const { data: service } = await db
    .from("services")
    .select("id, provider_id, price_minor, currency, delivery_days, status")
    .eq("id", input.serviceId)
    .maybeSingle();

  if (!service || service.status !== "active") return { error: "Cette prestation n'est plus disponible." };
  if (service.provider_id === user.id) return { error: "Vous ne pouvez pas commander votre propre prestation." };

  const now = new Date();
  const split = splitOrderAmount(BigInt(service.price_minor), DEFAULT_COMMISSION_BPS);

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
      due_at: new Date(now.getTime() + service.delivery_days * 86_400_000).toISOString(),
    })
    .select("id")
    .single();

  if (error || !order) return { error: "La commande n'a pas pu être créée. Réessayez." };

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

  const rule = ORDER_RULES[input.action];
  if (!rule || !UUID_RE.test(input.orderId)) return { error: "Action inconnue." };

  const db = createAdminClient();
  const { data: order } = await db
    .from("orders")
    .select("id, status, client_id, provider_id")
    .eq("id", input.orderId)
    .maybeSingle();

  if (!order) return { error: "Commande introuvable." };

  const allowed = rule.role === "client" ? order.client_id === user.id : order.provider_id === user.id;
  if (!allowed) return { error: "Action non autorisée sur cette commande." };
  if (!(rule.from as readonly string[]).includes(order.status)) {
    return { error: "Cette action n'est pas possible dans l'état actuel de la commande." };
  }

  try {
    assertTransition(order.status as OrderStatus, rule.to as OrderStatus);
  } catch {
    return { error: "Transition refusée." };
  }

  let reason: string | null = null;
  if ("needsReason" in rule && rule.needsReason) {
    reason = (input.reason ?? "").trim();
    if (reason.length < 20 || reason.length > 2000) {
      return { error: "Décrivez le problème en 20 à 2000 caractères." };
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

  if (error || !updated) return { error: "La commande a changé entre-temps. Actualisez la page." };

  if (reason) {
    const { error: disputeErr } = await db.from("disputes").insert({
      order_id: order.id,
      opened_by: user.id,
      reason,
      status: "open",
    });
    if (disputeErr) console.error("advanceOrder dispute:", disputeErr.message);
  }

  revalidatePath(`/orders/${order.id}`);
  revalidatePath("/orders");
  return { success: true };
}

/** Message dans le fil d'une commande. La politique RLS n'autorise que les parties concernées. */
export async function sendMessage(input: { orderId: string; body: string }): Promise<Result> {
  const user = await requireAuth();
  const body = input.body.trim();

  if (!UUID_RE.test(input.orderId)) return { error: "Commande introuvable." };
  if (body.length < 1 || body.length > 2000) return { error: "Message : 1 à 2000 caractères." };

  const supabase = await createClient();
  const { error } = await supabase.from("messages").insert({
    order_id: input.orderId,
    sender_id: user.id,
    body,
  });
  if (error) return { error: "Message non envoyé." };

  revalidatePath(`/orders/${input.orderId}`);
  return { success: true };
}

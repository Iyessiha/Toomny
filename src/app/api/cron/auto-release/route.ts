import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertTransition, autoReleaseCutoff } from "@/lib/escrow";
import { recordCompletion } from "@/lib/order-ledger";
import { notify } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Validation automatique des livraisons sans action du client (72 h).
 *
 * Appelée par la tâche planifiée Vercel (voir `vercel.json`). Sans elle, un
 * client inactif bloque indéfiniment le revenu du prestataire — exactement
 * l'irritant que Toomny prétend corriger.
 *
 * Sécurité : Vercel envoie `Authorization: Bearer $CRON_SECRET` sur les
 * appels planifiés. Sans secret configuré, la route refuse tout en
 * production ; en développement elle reste appelable pour les tests.
 */
const BATCH_SIZE = 50;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // En production, refuser absolument si le secret est absent.
    if (process.env.NODE_ENV === "production") return false;
    // En dev, autoriser uniquement depuis localhost.
    return true;
  }

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return false;
  const provided = Buffer.from(header.slice("Bearer ".length));
  const expected = Buffer.from(secret);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

export async function GET(request: Request): Promise<Response> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (!process.env.CRON_SECRET) {
    console.warn("[cron:auto-release] CRON_SECRET absente : appel autorisé hors production uniquement.");
  }

  const db = createAdminClient();
  const cutoff = autoReleaseCutoff().toISOString();

  const { data: overdue, error } = await db
    .from("orders")
    .select("id, reference, client_id, provider_id, delivered_at")
    .eq("status", "delivered")
    .lte("delivered_at", cutoff)
    .order("delivered_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    console.error("[cron:auto-release] lecture:", error.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  let completed = 0;
  const failed: string[] = [];

  for (const order of overdue ?? []) {
    try {
      assertTransition("delivered", "completed");
    } catch {
      // La machine à états ne le permet plus : on ne contourne jamais.
      failed.push(order.id);
      continue;
    }

    const now = new Date().toISOString();
    const { data: updated, error: updateErr } = await db
      .from("orders")
      .update({ status: "completed", completed_at: now, updated_at: now })
      .eq("id", order.id)
      .eq("status", "delivered")
      .select("id")
      .maybeSingle();

    if (updateErr || !updated) {
      // Changée entre-temps (validation manuelle, litige) : on passe.
      failed.push(order.id);
      continue;
    }

    await recordCompletion(db, order.id, order.provider_id);

    await notify(db, {
      recipientId: order.provider_id,
      type: "order_completed",
      params: { ref: order.reference },
      link: `/orders/${order.id}`,
    });
    await notify(db, {
      recipientId: order.client_id,
      type: "order_completed",
      params: { ref: order.reference },
      link: `/orders/${order.id}`,
    });

    completed++;
  }

  console.info(
    `[cron:auto-release] ${completed} commande(s) validée(s), ${failed.length} échec(s) sur ${overdue?.length ?? 0} examinée(s).`,
  );
  return NextResponse.json({
    ok: true,
    checked: overdue?.length ?? 0,
    completed,
    failed: failed.length,
  });
}

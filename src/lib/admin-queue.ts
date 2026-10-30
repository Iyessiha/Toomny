import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveDisplayNames } from "@/lib/names";
import { isStale } from "@/lib/admin-age";

/** Un élément concret de la file de travail, avec l'action directe à effectuer. */
export type QueueItem = {
  key: string;
  kind: "kyc" | "service" | "service_resubmit" | "dispute" | "order" | "payout" | "support";
  label: string;
  title: string;
  createdAt: string;
  href: string;
  actionLabel: string;
  urgent: boolean;
};

export const QUEUE_KIND_LABEL: Record<QueueItem["kind"], string> = {
  kyc: "Identité",
  service: "Prestation à valider",
  service_resubmit: "Prestation resoumise",
  dispute: "Litige",
  order: "Commande en retard",
  payout: "Versement",
  support: "Support",
};

/**
 * File de travail de l'administration : les éléments les plus anciens de chaque
 * famille, urgents d'abord (plus de 48 h), puis par ancienneté.
 * `perKind` borne chaque famille pour que la file reste lisible.
 */
export async function getAdminQueue(perKind = 4): Promise<QueueItem[]> {
  const db = createAdminClient();
  const nowIso = new Date().toISOString();

  const [kyc, services, disputes, overdue, payouts, support] = await Promise.all([
    db.from("verifications").select("id, profile_id, document_type, created_at").eq("status", "pending").order("created_at", { ascending: true }).limit(perKind),
    db.from("services").select("id, title, created_at, review_requested_at").eq("status", "draft").order("created_at", { ascending: true }).limit(perKind * 3),
    db.from("disputes").select("id, reason, created_at").eq("status", "open").order("created_at", { ascending: true }).limit(perKind),
    db.from("orders").select("id, reference, status, due_at").in("status", ["funded", "in_progress"]).lt("due_at", nowIso).order("due_at", { ascending: true }).limit(perKind),
    db.from("payouts").select("id, amount_minor, currency, status, created_at").in("status", ["queued", "processing", "failed"]).order("created_at", { ascending: true }).limit(perKind),
    db.from("support_requests").select("id, subject, created_at").eq("status", "open").eq("awaiting_admin", true).order("created_at", { ascending: true }).limit(perKind),
  ]);

  const names = await resolveDisplayNames(
    (kyc.data ?? []).map((v) => v.profile_id as string),
  );

  const items: QueueItem[] = [];

  for (const v of kyc.data ?? []) {
    items.push({
      key: `kyc-${v.id}`,
      kind: "kyc",
      label: QUEUE_KIND_LABEL.kyc,
      title: `${names.get(v.profile_id as string)?.name ?? "Compte"} · ${v.document_type}`,
      createdAt: v.created_at,
      href: `/admin/verifications`,
      actionLabel: "Examiner",
      urgent: isStale(v.created_at),
    });
  }

  // Une prestation resoumise après correction est prioritaire sur une nouvelle.
  for (const s of services.data ?? []) {
    const resubmitted = Boolean(s.review_requested_at);
    items.push({
      key: `service-${s.id}`,
      kind: resubmitted ? "service_resubmit" : "service",
      label: QUEUE_KIND_LABEL[resubmitted ? "service_resubmit" : "service"],
      title: s.title,
      createdAt: s.review_requested_at ?? s.created_at,
      href: `/admin/services/${s.id}`,
      actionLabel: "Valider",
      urgent: resubmitted || isStale(s.created_at),
    });
  }

  for (const d of disputes.data ?? []) {
    items.push({
      key: `dispute-${d.id}`,
      kind: "dispute",
      label: QUEUE_KIND_LABEL.dispute,
      title: d.reason ?? "Litige ouvert",
      createdAt: d.created_at,
      href: "/admin/disputes",
      actionLabel: "Traiter",
      urgent: isStale(d.created_at),
    });
  }

  for (const o of overdue.data ?? []) {
    items.push({
      key: `order-${o.id}`,
      kind: "order",
      label: QUEUE_KIND_LABEL.order,
      title: `${o.reference} · ${o.status === "funded" ? "pas encore démarrée" : "délai dépassé"}`,
      createdAt: o.due_at,
      href: `/admin/orders/${o.id}`,
      actionLabel: "Relancer",
      urgent: true,
    });
  }

  for (const p of payouts.data ?? []) {
    items.push({
      key: `payout-${p.id}`,
      kind: "payout",
      label: QUEUE_KIND_LABEL.payout,
      title: `${p.status === "failed" ? "Échec" : "En attente"} · ${p.amount_minor} ${p.currency}`,
      createdAt: p.created_at,
      href: "/admin/payouts",
      actionLabel: p.status === "failed" ? "Relancer" : "Traiter",
      urgent: p.status === "failed",
    });
  }

  for (const r of support.data ?? []) {
    items.push({
      key: `support-${r.id}`,
      kind: "support",
      label: QUEUE_KIND_LABEL.support,
      title: r.subject ?? "Demande de contact",
      createdAt: r.created_at,
      href: "/admin/support",
      actionLabel: "Répondre",
      urgent: isStale(r.created_at),
    });
  }

  return items.sort((a, b) => {
    if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

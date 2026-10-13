import type { SupabaseClient } from "@supabase/supabase-js";

/** Actions sensibles journalisées. Ajouter ici avant de les enregistrer. */
export type AdminAction =
  | "kyc.approve"
  | "kyc.reject"
  | "kyc.flag"
  | "service.moderate"
  | "order.confirm_payment"
  | "order.force_in_progress"
  | "order.force_delivered"
  | "order.force_completed"
  | "dispute.resolve"
  | "payout.process"
  | "payout.mark_paid"
  | "payout.mark_failed"
  | "payout.requeue"
  | "plan.set";

export type AdminAuditEntry = {
  actorId: string;
  action: AdminAction;
  targetType: "verification" | "service" | "order" | "dispute" | "payout" | "provider";
  targetId: string;
  details?: Record<string, unknown>;
};

/**
 * Écrit une ligne dans le journal. Appelée après l'action elle-même : si
 * l'écriture échoue, l'action a déjà eu lieu et ne peut pas être annulée.
 * On journalise donc l'erreur plutôt que de la faire remonter à l'admin.
 */
export async function recordAdminAction(db: SupabaseClient, entry: AdminAuditEntry): Promise<void> {
  const { error } = await db.from("admin_audit_log").insert({
    actor_id: entry.actorId,
    action: entry.action,
    target_type: entry.targetType,
    target_id: entry.targetId,
    details: entry.details ?? {},
  });
  if (error) console.error("recordAdminAction:", error.message);
}

export type AdminAuditRow = {
  id: number;
  actor_id: string;
  actor_name: string;
  action: string;
  target_type: string;
  target_id: string;
  created_at: string;
};

/** Dernières actions, avec le nom de l'administrateur pour l'affichage. */
export async function getRecentAdminActions(db: SupabaseClient, limit = 20): Promise<AdminAuditRow[]> {
  const { data: rows, error } = await db
    .from("admin_audit_log")
    .select("id, actor_id, action, target_type, target_id, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !rows) return [];

  const actorIds = [...new Set(rows.map((r) => r.actor_id))];
  const { data: actors } = await db.from("profiles").select("id, display_name, email").in("id", actorIds);
  const names = new Map((actors ?? []).map((a) => [a.id as string, (a.display_name ?? a.email ?? "—") as string]));

  return rows.map((r) => ({ ...r, actor_name: names.get(r.actor_id) ?? "—" })) as AdminAuditRow[];
}

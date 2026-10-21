import type { SupabaseClient } from "@supabase/supabase-js";
import { notify } from "@/lib/notifications";
import { sendBoostReminderEmail } from "@/lib/email";

/** Pas plus d'une relance par prestataire toutes les deux semaines. */
const REMINDER_INTERVAL_MS = 14 * 86_400_000;
/** Un prestataire qui a acheté un boost depuis un mois n'est pas relancé. */
const BOOST_RECENT_MS = 30 * 86_400_000;
/** Plafond par passage : protège le quota d'envoi quotidien de Resend. */
export const MAX_REMINDERS_PER_RUN = 30;

export type BoostReminderResult = { eligible: number; sent: number };

/**
 * Choisit les prestataires à relancer : vérifiés, avec une prestation en ligne, sans boost
 * en cours ni acheté depuis 30 jours, et non relancés depuis 14 jours. Chacun reçoit au plus
 * un e-mail par passage et le passage est plafonné.
 */
export async function runBoostReminders(db: SupabaseClient, now: Date = new Date()): Promise<BoostReminderResult> {
  const nowIso = now.toISOString();
  const reminderCutoff = new Date(now.getTime() - REMINDER_INTERVAL_MS).toISOString();
  const boostCutoff = new Date(now.getTime() - BOOST_RECENT_MS).toISOString();

  const [{ data: providers }, { data: services }, { data: boosts }, { data: reminders }] = await Promise.all([
    db
      .from("profiles")
      .select("id, first_name, preferred_locale")
      .in("role", ["provider", "both"])
      .eq("verification_status", "verified"),
    db.from("services").select("id, title, provider_id").eq("status", "active").order("created_at", { ascending: false }),
    db
      .from("boosts")
      .select("provider_id")
      .or(`created_at.gt.${boostCutoff},period_end.gt.${nowIso}`),
    db.from("notifications").select("recipient_id").eq("type", "boost_reminder").gt("created_at", reminderCutoff),
  ]);

  const latestService = new Map<string, { id: string; title: string }>();
  for (const s of services ?? []) {
    if (!latestService.has(s.provider_id)) latestService.set(s.provider_id, { id: s.id, title: s.title ?? "" });
  }
  const boosted = new Set((boosts ?? []).map((b) => b.provider_id));
  const recentlyReminded = new Set((reminders ?? []).map((r) => r.recipient_id));

  const eligible = (providers ?? []).filter(
    (p) => latestService.has(p.id) && !boosted.has(p.id) && !recentlyReminded.has(p.id),
  );

  let sent = 0;
  for (const p of eligible.slice(0, MAX_REMINDERS_PER_RUN)) {
    const service = latestService.get(p.id);
    if (!service) continue;
    const locale = p.preferred_locale === "en" ? "en" : "fr";
    // Notification in-app pour l'historique ; l'e-mail est envoyé à part, avec le modèle dédié.
    await notify(db, {
      recipientId: p.id,
      type: "boost_reminder",
      params: { service: service.title },
      link: "/dashboard/boost",
      sendEmail: false,
    });
    const { data: author } = await db.auth.admin.getUserById(p.id);
    if (author?.user?.email) {
      const ok = await sendBoostReminderEmail({
        to: author.user.email,
        firstName: p.first_name ?? "",
        serviceTitle: service.title,
        locale,
      });
      if (ok) sent++;
    }
  }

  return { eligible: eligible.length, sent };
}

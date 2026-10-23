import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { SupportReplyForm } from "@/components/admin/support-reply-form";
import { getAdminNavGroups } from "@/lib/admin-nav";
import { EmptyState } from "@/components/dashboard/shell";
import { Pill, Section } from "@/components/dashboard/pro";
import { formatSubmittedAt } from "@/i18n/auth";
import { getAdminTexts } from "@/i18n/admin";
import { visitorLocale } from "@/i18n/server-locale";
import { closeSupportRequest } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getAdminTexts(await visitorLocale()).nav.support };
}
export const dynamic = "force-dynamic";

const copy = {
  fr: {
    title: "Demandes de contact",
    subtitle: "Messages envoyés par les prestataires et clients depuis « Contacter Toomny ». Répondez ici : le demandeur est notifié.",
    open: "En cours",
    answered: "Répondue",
    closed: "Traitée",
    close: "Marquer traitée",
    emptyTitle: "Aucune demande",
    emptyBody: "Les demandes de contact apparaîtront ici.",
    from: "De",
    received: "Reçue le",
    history: "Échanges",
    teamLabel: "Équipe Toomny",
    placeholder: "Votre réponse au demandeur…",
    draft: "Rédiger avec l'IA",
    drafting: "Rédaction…",
    send: "Envoyer la réponse",
    sending: "Envoi…",
    draftHint: "Brouillon généré. Relisez-le et modifiez-le avant d'envoyer : rien n'est envoyé automatiquement.",
    sent: "Réponse envoyée. Le demandeur a été notifié.",
  },
  en: {
    title: "Contact requests",
    subtitle: "Messages sent by providers and clients from “Contact Toomny”. Reply here: the requester is notified.",
    open: "Open",
    answered: "Replied",
    closed: "Closed",
    close: "Mark as closed",
    emptyTitle: "No requests",
    emptyBody: "Contact requests will appear here.",
    from: "From",
    received: "Received on",
    history: "Exchanges",
    teamLabel: "Toomny team",
    placeholder: "Your reply to the requester…",
    draft: "Draft with AI",
    drafting: "Drafting…",
    send: "Send reply",
    sending: "Sending…",
    draftHint: "Draft generated. Review and edit it before sending: nothing is sent automatically.",
    sent: "Reply sent. The requester has been notified.",
  },
} as const;

export default async function AdminSupportPage() {
  const user = await requireAdmin();
  const locale = user.preferredLocale;
  const t = copy[locale];

  const db = createAdminClient();
  const { data: rows } = await db
    .from("support_requests")
    .select(
      "id, subject, body, status, created_at, replied_at, profile:profiles(display_name, email, role), replies:support_replies(id, body, created_at)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const list = (rows ?? []).map((r) => {
    const profile = Array.isArray(r.profile) ? r.profile[0] : r.profile;
    const replies = [...(r.replies ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at));
    return { ...r, profile, replies };
  });

  return (
    <AdminShell
      user={user}
      locale={locale}
      kicker="Administration"
      title={t.title}
      subtitle={t.subtitle}
      nav={getAdminNavGroups(locale, "/admin/support")}
    >
      {list.length === 0 ? (
        <Section title={t.emptyTitle}>
          <EmptyState title={t.emptyTitle} body={t.emptyBody} />
        </Section>
      ) : (
        <div className="space-y-4">
          {list.map((r) => {
            const isClosed = r.status === "closed";
            const pill = isClosed
              ? { tone: "neutral" as const, label: t.closed }
              : r.replied_at
                ? { tone: "success" as const, label: t.answered }
                : { tone: "warning" as const, label: t.open };
            return (
              <article key={r.id} className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{r.subject}</p>
                    <p className="mt-0.5 text-xs text-[var(--subtle)]">
                      {t.from} : {r.profile?.display_name ?? "—"} · {r.profile?.email} · {t.received}{" "}
                      {formatSubmittedAt(r.created_at, locale)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Pill tone={pill.tone}>{pill.label}</Pill>
                    {!isClosed && (
                      <form action={closeSupportRequest}>
                        <input type="hidden" name="requestId" value={r.id} />
                        <button type="submit" className="btn-ghost btn-sm">{t.close}</button>
                      </form>
                    )}
                  </div>
                </div>

                <p className="mt-3 whitespace-pre-line rounded-xl bg-[var(--surface)] p-3 text-sm">{r.body}</p>

                {r.replies.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--subtle)]">{t.history}</p>
                    <ul className="mt-2 space-y-2">
                      {r.replies.map((reply) => (
                        <li key={reply.id} className="rounded-xl border border-[var(--border)] p-3 text-sm">
                          <p className="text-[11px] text-[var(--subtle)]">
                            {t.teamLabel} · {formatSubmittedAt(reply.created_at, locale)}
                          </p>
                          <p className="mt-1 whitespace-pre-line">{reply.body}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {!isClosed && (
                  <SupportReplyForm
                    requestId={r.id}
                    copy={{
                      placeholder: t.placeholder,
                      draft: t.draft,
                      drafting: t.drafting,
                      send: t.send,
                      sending: t.sending,
                      draftHint: t.draftHint,
                      sent: t.sent,
                    }}
                  />
                )}
              </article>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}

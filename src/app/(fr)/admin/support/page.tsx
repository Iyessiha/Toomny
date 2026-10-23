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
    subtitle: "Conversations avec les prestataires et clients. Répondez ici : le message arrive dans leur espace, un e-mail part seulement si nécessaire.",
    toAnswer: "À répondre",
    waitingRequester: "En attente du demandeur",
    closed: "Traitée",
    close: "Marquer traitée",
    emptyTitle: "Aucune demande",
    emptyBody: "Les demandes de contact apparaîtront ici.",
    from: "De",
    received: "Reçue le",
    team: "Équipe Toomny",
    placeholder: "Votre réponse…",
    draft: "Rédiger avec l'IA",
    drafting: "Rédaction…",
    send: "Envoyer la réponse",
    sending: "Envoi…",
    draftHint: "Brouillon généré. Relisez-le et modifiez-le avant d'envoyer : rien n'est envoyé automatiquement.",
    sent: "Réponse envoyée.",
  },
  en: {
    title: "Contact requests",
    subtitle: "Conversations with providers and clients. Reply here: the message appears in their space, an email is sent only when needed.",
    toAnswer: "To answer",
    waitingRequester: "Waiting for requester",
    closed: "Closed",
    close: "Mark as closed",
    emptyTitle: "No requests",
    emptyBody: "Contact requests will appear here.",
    from: "From",
    received: "Received on",
    team: "Toomny team",
    placeholder: "Your reply…",
    draft: "Draft with AI",
    drafting: "Drafting…",
    send: "Send reply",
    sending: "Sending…",
    draftHint: "Draft generated. Review and edit it before sending: nothing is sent automatically.",
    sent: "Reply sent.",
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
      "id, subject, body, status, created_at, awaiting_admin, profile:profiles(display_name, email, role), replies:support_replies(id, body, created_at, author_role)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const list = (rows ?? []).map((r) => {
    const profile = Array.isArray(r.profile) ? r.profile[0] : r.profile;
    const thread = [
      { id: `req-${r.id}`, role: "requester" as const, body: r.body, at: r.created_at },
      ...(r.replies ?? []).map((reply) => ({
        id: reply.id,
        role: reply.author_role as "admin" | "requester",
        body: reply.body,
        at: reply.created_at,
      })),
    ].sort((a, b) => a.at.localeCompare(b.at));
    return { ...r, profile, thread };
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
              : r.awaiting_admin
                ? { tone: "warning" as const, label: t.toAnswer }
                : { tone: "neutral" as const, label: t.waitingRequester };
            const requesterName = r.profile?.display_name ?? "—";
            return (
              <article key={r.id} className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{r.subject}</p>
                    <p className="mt-0.5 text-xs text-[var(--subtle)]">
                      {t.from} : {requesterName} · {r.profile?.email} · {t.received}{" "}
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

                <ul className="mt-4 space-y-2">
                  {r.thread.map((m) => {
                    const fromTeam = m.role === "admin";
                    return (
                      <li
                        key={m.id}
                        className={`rounded-xl p-3 text-sm ${fromTeam ? "ml-6 border border-[var(--border)]" : "mr-6 bg-[var(--surface)]"}`}
                      >
                        <p className="text-[11px] text-[var(--subtle)]">
                          {fromTeam ? t.team : requesterName} · {formatSubmittedAt(m.at, locale)}
                        </p>
                        <p className="mt-1 whitespace-pre-line">{m.body}</p>
                      </li>
                    );
                  })}
                </ul>

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

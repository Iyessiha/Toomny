import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/shell";
import { dashboardNavSections } from "@/lib/dashboard-nav";
import { getDashboardTexts } from "@/i18n/dashboard";
import { SupportForm } from "@/components/dashboard/support-form";
import { Pill } from "@/components/dashboard/pro";
import { formatSubmittedAt } from "@/i18n/auth";
import { visitorLocale } from "@/i18n/server-locale";
import { SupportConversationReply, SupportSeenMarker } from "@/components/dashboard/support-conversation";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await visitorLocale();
  return { title: locale === "en" ? "Contact Toomny · Toomny" : "Contacter Toomny · Toomny" };
}
export const dynamic = "force-dynamic";

const copy = {
  fr: {
    title: "Contacter Toomny",
    subtitle: "Un problème avec une commande, un paiement ou votre compte ? Écrivez-nous ici.",
    formTitle: "Nouvelle demande",
    historyTitle: "Mes conversations",
    empty: "Vous n'avez encore envoyé aucune demande.",
    awaitingTeam: "En attente de l'équipe",
    answered: "Répondue",
    closed: "Traitée",
    you: "Vous",
    team: "Équipe Toomny",
    note: "Votre demande arrive dans l'équipe Toomny. Pour un litige sur une commande, passez par la commande.",
  },
  en: {
    title: "Contact Toomny",
    subtitle: "A problem with an order, a payment or your account? Write to us here.",
    formTitle: "New request",
    historyTitle: "My conversations",
    empty: "You have not sent any request yet.",
    awaitingTeam: "Waiting for the team",
    answered: "Answered",
    closed: "Closed",
    you: "You",
    team: "Toomny team",
    note: "Your request goes to the Toomny team. For a dispute on an order, use the order page.",
  },
} as const;

export default async function SupportPage() {
  const user = await requireAuth();
  const locale = user.preferredLocale;
  const t = copy[locale];
  const nav = getDashboardTexts(locale).nav;

  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("support_requests")
    .select("id, subject, body, status, created_at, awaiting_admin, replies:support_replies(id, body, created_at, author_role)")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <DashboardShell
      user={user}
      kicker={nav.support}
      title={t.title}
      subtitle={t.subtitle}
      locale={locale}
      navSections={dashboardNavSections(nav, user.role, "/dashboard/support")}
    >
      <SupportSeenMarker />
      <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <section className="h-fit rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
          <h2 className="font-display text-base font-bold">{t.formTitle}</h2>
          <p className="mt-1 text-sm text-[var(--subtle)]">{t.note}</p>
          <div className="mt-4">
            <SupportForm locale={locale} />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-base font-bold">{t.historyTitle}</h2>
          {!requests || requests.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 text-sm text-[var(--subtle)]">
              {t.empty}
            </div>
          ) : (
            requests.map((r) => {
              const isClosed = r.status === "closed";
              const pill = isClosed
                ? { tone: "neutral" as const, label: t.closed }
                : r.awaiting_admin
                  ? { tone: "warning" as const, label: t.awaitingTeam }
                  : { tone: "success" as const, label: t.answered };
              const thread = [
                { id: `req-${r.id}`, role: "requester" as const, body: r.body, at: r.created_at },
                ...r.replies.map((reply) => ({
                  id: reply.id,
                  role: reply.author_role as "admin" | "requester",
                  body: reply.body,
                  at: reply.created_at,
                })),
              ].sort((a, b) => a.at.localeCompare(b.at));

              return (
                <article key={r.id} className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{r.subject}</p>
                    <Pill tone={pill.tone}>{pill.label}</Pill>
                  </div>
                  <ul className="mt-3 space-y-2">
                    {thread.map((m) => {
                      const mine = m.role === "requester";
                      return (
                        <li
                          key={m.id}
                          className={`rounded-xl p-3 text-sm ${mine ? "ml-6 bg-[var(--surface)]" : "mr-6 border border-[var(--border)]"}`}
                        >
                          <p className="text-[11px] text-[var(--subtle)]">
                            {mine ? t.you : t.team} · {formatSubmittedAt(m.at, locale)}
                          </p>
                          <p className="mt-1 whitespace-pre-line">{m.body}</p>
                        </li>
                      );
                    })}
                  </ul>
                  {!isClosed && <SupportConversationReply requestId={r.id} locale={locale} />}
                </article>
              );
            })
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

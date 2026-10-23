import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/shell";
import { dashboardNavSections } from "@/lib/dashboard-nav";
import { getDashboardTexts } from "@/i18n/dashboard";
import { SupportForm } from "@/components/dashboard/support-form";
import { Pill, TableCard } from "@/components/dashboard/pro";
import { formatSubmittedAt } from "@/i18n/auth";
import { visitorLocale } from "@/i18n/server-locale";

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
    historyTitle: "Mes demandes",
    empty: "Vous n'avez encore envoyé aucune demande.",
    open: "En cours",
    answered: "Répondue",
    closed: "Traitée",
    teamReply: "Réponse de l'équipe Toomny",
    colSubject: "Sujet",
    colStatus: "Statut",
    colDate: "Envoyée le",
    note: "Votre demande arrive dans l'équipe Toomny. Pour un litige sur une commande, passez par la commande.",
  },
  en: {
    title: "Contact Toomny",
    subtitle: "A problem with an order, a payment or your account? Write to us here.",
    formTitle: "New request",
    historyTitle: "My requests",
    empty: "You have not sent any request yet.",
    open: "Open",
    answered: "Answered",
    closed: "Closed",
    teamReply: "Reply from the Toomny team",
    colSubject: "Subject",
    colStatus: "Status",
    colDate: "Sent on",
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
    .select("id, subject, status, created_at, replied_at, replies:support_replies(id, body, created_at)")
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
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
          <h2 className="font-display text-base font-bold">{t.formTitle}</h2>
          <p className="mt-1 text-sm text-[var(--subtle)]">{t.note}</p>
          <div className="mt-4">
            <SupportForm locale={locale} />
          </div>
        </section>

        <section>
          {!requests || requests.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 text-sm text-[var(--subtle)]">
              {t.empty}
            </div>
          ) : (
            <TableCard title={t.historyTitle}>
              <thead>
                <tr>
                  <th>{t.colSubject}</th>
                  <th>{t.colDate}</th>
                  <th>{t.colStatus}</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td className="font-semibold">{r.subject}</td>
                    <td className="text-xs text-[var(--subtle)]">{formatSubmittedAt(r.created_at, locale)}</td>
                    <td>
                      <Pill tone={r.status === "closed" ? "neutral" : r.replied_at ? "success" : "warning"}>
                        {r.status === "closed" ? t.closed : r.replied_at ? t.answered : t.open}
                      </Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableCard>
          )}
          {requests
            ?.filter((r) => r.replies.length > 0)
            .map((r) => (
              <div key={r.id} className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
                <p className="text-sm font-semibold">{r.subject}</p>
                <ul className="mt-3 space-y-3">
                  {[...r.replies]
                    .sort((a, b) => a.created_at.localeCompare(b.created_at))
                    .map((reply) => (
                      <li key={reply.id} className="rounded-xl bg-[var(--surface)] p-3 text-sm">
                        <p className="text-[11px] text-[var(--subtle)]">
                          {t.teamReply} · {formatSubmittedAt(reply.created_at, locale)}
                        </p>
                        <p className="mt-1 whitespace-pre-line">{reply.body}</p>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
        </section>
      </div>
    </DashboardShell>
  );
}

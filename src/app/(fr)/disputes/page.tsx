import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell, EmptyState } from "@/components/dashboard/shell";
import { getDashboardTexts } from "@/i18n/dashboard";
import { getMarketplaceTexts } from "@/i18n/marketplace";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const user = await requireAuth();
  return { title: getMarketplaceTexts(user.preferredLocale).disputes.metaTitle };
}

const RESOLVED = ["resolved_client", "resolved_provider", "resolved_split"];

function statusColor(status: string) {
  if (RESOLVED.includes(status)) return "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400";
  if (status === "awaiting_client") return "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-500";
  return "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400";
}

export default async function DisputesPage() {
  const user = await requireAuth();
  const locale = user.preferredLocale;
  const t = getMarketplaceTexts(locale).disputes;
  const nav = getDashboardTexts(locale).nav;
  const supabase = await createClient();

  // RLS : seuls les litiges des commandes de l'utilisateur sont visibles.
  const { data } = await supabase
    .from("disputes")
    .select("id, reason, status, created_at, order:orders(id, reference, client_id, provider_id)")
    .order("created_at", { ascending: false })
    .limit(100);

  const disputes = (data ?? []).map((d) => ({
    ...d,
    order: Array.isArray(d.order) ? d.order[0] : d.order,
  }));

  return (
    <DashboardShell
      user={user}
      locale={locale}
      title={t.title}
      subtitle={t.subtitle}
      nav={[
        { href: "/dashboard", label: nav.overview },
        { href: "/orders", label: nav.orders },
        { href: "/messages", label: nav.messages },
        { href: "/disputes", label: t.title, current: true },
      ]}
    >
      {disputes.length === 0 ? (
        <EmptyState title={t.empty} body={t.emptyBody} />
      ) : (
        <ul className="space-y-4">
          {disputes.map((d) => {
            const isResolved = RESOLVED.includes(d.status);
            const awaitingMe =
              (d.status === "awaiting_client" && d.order?.client_id === user.id) ||
              (d.status === "awaiting_provider" && d.order?.provider_id === user.id);

            return (
              <li key={d.id} className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {t.order}{" "}
                      <Link
                        href={`/orders/${d.order?.id}`}
                        className="text-[var(--color-brand-600)] underline-offset-2 hover:underline"
                      >
                        {d.order?.reference}
                      </Link>
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--subtle)]">
                      {t.openedOn}{" "}
                      {new Date(d.created_at).toLocaleDateString(
                        locale === "en" ? "en-GB" : "fr-FR",
                        { day: "2-digit", month: "short", year: "numeric" }
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {awaitingMe && (
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                        ⚠ {t.awaitingYou}
                      </span>
                    )}
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor(d.status)}`}>
                      {t.status[d.status] ?? d.status}
                    </span>
                  </div>
                </div>

                {/* Reason */}
                <p className="mt-3 rounded-xl bg-[var(--surface)] px-4 py-3 text-sm">
                  <span className="font-medium text-[var(--subtle)]">{t.reason} : </span>
                  {d.reason}
                </p>

                {/* Actions */}
                {!isResolved && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-4">
                    <Link
                      href={`/orders/${d.order?.id}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-brand-500)] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[var(--color-brand-600)]"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      {t.replyButton}
                    </Link>
                    <Link
                      href={`/orders/${d.order?.id}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold transition-colors hover:border-[var(--color-brand-400)]"
                    >
                      {t.viewOrder}
                    </Link>
                  </div>
                )}

                {isResolved && (
                  <div className="mt-4 flex items-center gap-2 border-t border-[var(--border)] pt-4">
                    <Link
                      href={`/orders/${d.order?.id}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold transition-colors hover:border-[var(--color-brand-400)]"
                    >
                      {t.viewOrder}
                    </Link>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </DashboardShell>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { DashboardShell, EmptyState } from "@/components/dashboard/shell";
import { statusTone } from "@/lib/dashboard";
import { getDashboardTexts } from "@/i18n/dashboard";
import { formatMoney } from "@/lib/money";
import { confirmPaymentReceived, forceOrderTransition } from "./actions";
import { getAdminTexts } from "@/i18n/admin";
import { visitorLocale } from "@/i18n/server-locale";
import { getMarketplaceTexts } from "@/i18n/marketplace";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getAdminTexts(await visitorLocale()).ordersPage.metaTitle };
}
export const dynamic = "force-dynamic";

const ALL_STATUSES = ["pending_payment", "funded", "in_progress", "delivered", "disputed"] as const;
type ActiveStatus = (typeof ALL_STATUSES)[number];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireAdmin();
  const locale = user.preferredLocale;
  const t = getAdminTexts(locale).ordersPage;
  const nav = getAdminTexts(locale).nav;
  const { status: statusParam } = await searchParams;

  const activeFilter: ActiveStatus | "all" =
    statusParam && (ALL_STATUSES as readonly string[]).includes(statusParam)
      ? (statusParam as ActiveStatus)
      : "all";

  const db = createAdminClient();

  let query = db
    .from("orders")
    .select("id, reference, status, amount_minor, currency, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (activeFilter === "all") {
    query = query.in("status", [...ALL_STATUSES]);
  } else {
    query = query.eq("status", activeFilter);
  }

  const { data } = await query;
  const list = data ?? [];

  const filters: { key: ActiveStatus | "all"; label: string }[] = [
    { key: "all", label: t.filterAll },
    { key: "pending_payment", label: t.filterPending },
    { key: "funded", label: t.filterFunded },
    { key: "in_progress", label: t.filterProgress },
    { key: "delivered", label: t.filterDelivered },
    { key: "disputed", label: t.filterDisputed },
  ];

  function filterHref(key: string) {
    return key === "all" ? "/admin/orders" : `/admin/orders?status=${key}`;
  }

  return (
    <DashboardShell
      user={user}
      locale={locale}
      title={t.title}
      subtitle={t.subtitle}
      nav={[
        { href: "/admin", label: nav.overview },
        { href: "/admin/verifications", label: nav.kyc },
        { href: "/admin/services", label: nav.services },
        { href: "/admin/categories", label: nav.categories },
        { href: "/admin/users", label: nav.users },
        { href: "/admin/orders", label: nav.orders, current: true },
        { href: "/admin/disputes", label: getMarketplaceTexts(locale).nav.disputes },
        { href: "/dashboard", label: nav.myDashboard },
      ]}
    >
      {/* Filter tabs */}
      <div className="mb-5 flex flex-wrap gap-2">
        {filters.map(({ key, label }) => {
          const active = activeFilter === key;
          return (
            <Link
              key={key}
              href={filterHref(key)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? "bg-[var(--color-brand-500)] text-white"
                  : "border border-[var(--border)] text-[var(--subtle)] hover:border-[var(--color-brand-400)] hover:text-[var(--foreground)]"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {list.length === 0 ? (
        <EmptyState title={t.emptyTitle} body={t.emptyBody} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--background)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--subtle)]">
              <tr>
                <th className="px-5 py-3 font-medium">{t.colRef}</th>
                <th className="px-5 py-3 font-medium">{t.colStatus}</th>
                <th className="px-5 py-3 font-medium">{t.colDate}</th>
                <th className="px-5 py-3 text-right font-medium">{t.colAmount}</th>
                <th className="px-5 py-3 text-right font-medium">{t.colAction}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((o, i) => (
                <tr key={o.id} className={i < list.length - 1 ? "border-b border-[var(--border)]" : ""}>
                  <td className="px-5 py-4 font-medium">
                    <Link
                      href={`/orders/${o.id}`}
                      className="text-[var(--color-brand-600)] underline-offset-2 hover:underline"
                    >
                      {o.reference}
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(o.status)}`}>
                      {getDashboardTexts(locale).status[o.status] ?? o.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[var(--subtle)]">
                    {new Date(o.created_at).toLocaleDateString(
                      locale === "en" ? "en-GB" : "fr-FR",
                      { day: "2-digit", month: "short", year: "numeric" }
                    )}
                  </td>
                  <td className="px-5 py-4 text-right font-display font-bold">
                    {formatMoney(BigInt(o.amount_minor), o.currency, locale)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Link to detail */}
                      <Link
                        href={`/orders/${o.id}`}
                        className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium transition-colors hover:border-[var(--color-brand-400)]"
                      >
                        {t.viewDetail}
                      </Link>

                      {/* pending_payment → funded */}
                      {o.status === "pending_payment" && (
                        <form action={confirmPaymentReceived}>
                          <input type="hidden" name="orderId" value={o.id} />
                          <button
                            type="submit"
                            className="rounded-full bg-[var(--color-brand-500)] px-3 py-1.5 text-xs font-semibold text-white"
                          >
                            {t.confirm}
                          </button>
                        </form>
                      )}

                      {/* funded → in_progress */}
                      {o.status === "funded" && (
                        <form action={forceOrderTransition}>
                          <input type="hidden" name="orderId" value={o.id} />
                          <button
                            type="submit"
                            className="rounded-full bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white"
                          >
                            {t.forceStart}
                          </button>
                        </form>
                      )}

                      {/* in_progress → delivered */}
                      {o.status === "in_progress" && (
                        <form action={forceOrderTransition}>
                          <input type="hidden" name="orderId" value={o.id} />
                          <button
                            type="submit"
                            className="rounded-full bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white"
                          >
                            {t.forceDeliver}
                          </button>
                        </form>
                      )}

                      {/* delivered → completed */}
                      {o.status === "delivered" && (
                        <form action={forceOrderTransition}>
                          <input type="hidden" name="orderId" value={o.id} />
                          <button
                            type="submit"
                            className="rounded-full bg-green-600 px-3 py-1.5 text-xs font-semibold text-white"
                          >
                            {t.forceComplete}
                          </button>
                        </form>
                      )}

                      {/* disputed → link to disputes */}
                      {o.status === "disputed" && (
                        <Link
                          href="/admin/disputes"
                          className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          {getMarketplaceTexts(locale).nav.disputes}
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}

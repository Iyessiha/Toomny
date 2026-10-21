import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminNavGroups } from "@/lib/admin-nav";
import { EmptyState } from "@/components/dashboard/shell";
import { FilterTabs, Pill, TableCard, orderTone } from "@/components/dashboard/pro";
import { getDashboardTexts } from "@/i18n/dashboard";
import { formatMoney } from "@/lib/money";
import { confirmPaymentReceived, forceOrderTransition } from "./actions";
import { ResetOrdersButton } from "@/components/admin/reset-orders-button";
import { getAdminTexts } from "@/i18n/admin";
import { visitorLocale } from "@/i18n/server-locale";
import { getMarketplaceTexts } from "@/i18n/marketplace";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getAdminTexts(await visitorLocale()).ordersPage.metaTitle };
}
export const dynamic = "force-dynamic";

const ALL_STATUSES = ["pending_payment", "funded", "in_progress", "delivered", "disputed", "completed", "refunded"] as const;
type ActiveStatus = (typeof ALL_STATUSES)[number];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireAdmin();
  const locale = user.preferredLocale;
  const t = getAdminTexts(locale).ordersPage;
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
    { key: "completed", label: t.filterCompleted },
    { key: "refunded", label: t.filterRefunded },
  ];

  function filterHref(key: string) {
    return key === "all" ? "/admin/orders" : `/admin/orders?status=${key}`;
  }

  return (
    <AdminShell
      user={user}
      locale={locale}
      kicker="Administration"
      title={t.title}
      subtitle={t.subtitle}
      nav={getAdminNavGroups(locale, "/admin/orders")}
    >
      {process.env.NODE_ENV !== "production" && (
        <div className="mb-6 flex justify-end">
          <ResetOrdersButton />
        </div>
      )}

      <FilterTabs
        items={filters.map(({ key, label }) => ({
          href: filterHref(key),
          label,
          current: activeFilter === key,
        }))}
      />

      {list.length === 0 ? (
        <EmptyState title={t.emptyTitle} body={t.emptyBody} />
      ) : (
        <TableCard>
          <thead>
            <tr>
              <th>{t.colRef}</th>
              <th>{t.colStatus}</th>
              <th>{t.colDate}</th>
              <th className="text-right">{t.colAmount}</th>
              <th className="text-right">{t.colAction}</th>
            </tr>
          </thead>
          <tbody>
            {list.map((o) => (
              <tr key={o.id}>
                <td>
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="font-semibold text-[var(--color-brand-600)] underline-offset-2 hover:underline"
                  >
                    {o.reference}
                  </Link>
                </td>
                <td>
                  <Pill tone={orderTone(o.status)}>
                    {getDashboardTexts(locale).status[o.status] ?? o.status}
                  </Pill>
                </td>
                <td className="text-[var(--subtle)]">
                  {new Date(o.created_at).toLocaleDateString(
                    locale === "en" ? "en-GB" : "fr-FR",
                    { day: "2-digit", month: "short", year: "numeric" },
                  )}
                </td>
                <td className="text-right font-display font-bold">
                  {formatMoney(BigInt(o.amount_minor), o.currency, locale)}
                </td>
                <td>
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/admin/orders/${o.id}`} className="btn-ghost btn-sm">
                      {t.viewDetail}
                    </Link>

                    {/* pending_payment → funded */}
                    {o.status === "pending_payment" && (
                      <form action={confirmPaymentReceived}>
                        <input type="hidden" name="orderId" value={o.id} />
                        <button type="submit" className="btn-primary btn-sm">
                          {t.confirm}
                        </button>
                      </form>
                    )}

                    {/* funded → in_progress */}
                    {o.status === "funded" && (
                      <form action={forceOrderTransition}>
                        <input type="hidden" name="orderId" value={o.id} />
                        <button type="submit" className="btn-warn btn-sm">
                          {t.forceStart}
                        </button>
                      </form>
                    )}

                    {/* in_progress → delivered */}
                    {o.status === "in_progress" && (
                      <form action={forceOrderTransition}>
                        <input type="hidden" name="orderId" value={o.id} />
                        <button type="submit" className="btn-ghost btn-sm">
                          {t.forceDeliver}
                        </button>
                      </form>
                    )}

                    {/* delivered → completed */}
                    {o.status === "delivered" && (
                      <form action={forceOrderTransition}>
                        <input type="hidden" name="orderId" value={o.id} />
                        <button type="submit" className="btn-success btn-sm">
                          {t.forceComplete}
                        </button>
                      </form>
                    )}

                    {/* disputed → link to disputes */}
                    {o.status === "disputed" && (
                      <Link href="/admin/disputes" className="btn-danger btn-sm">
                        {getMarketplaceTexts(locale).nav.disputes}
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      )}
    </AdminShell>
  );
}

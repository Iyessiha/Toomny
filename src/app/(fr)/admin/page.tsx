import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getAdminStats } from "@/lib/admin-stats";
import { getRecentAdminActions } from "@/lib/admin-audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { DashboardShell, StatCard, EmptyState } from "@/components/dashboard/shell";
import { statusTone } from "@/lib/dashboard";
import { formatMoney } from "@/lib/money";
import { getAdminTexts } from "@/i18n/admin";
import { visitorLocale } from "@/i18n/server-locale";
import { getMarketplaceTexts } from "@/i18n/marketplace";
import { getDashboardTexts } from "@/i18n/dashboard";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getAdminTexts(await visitorLocale()).overview.title };
}
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireAdmin();
  const locale = user.preferredLocale;
  const t = getAdminTexts(locale).overview;
  const nav = getAdminTexts(locale).nav;
  const statusLabel = getDashboardTexts(locale).status;
  const s = await getAdminStats();
  const audit = await getRecentAdminActions(createAdminClient());

  const needsAttention = s.openDisputes + s.pendingVerifications;
  const plural = (n: number, one: string, many: string) => (n > 1 ? many : one);

  return (
    <DashboardShell
      user={user}
      locale={locale}
      title={t.title}
      subtitle={t.subtitle}
      nav={[
        { href: "/admin", label: nav.overview, current: true },
        { href: "/admin/verifications", label: nav.kyc },
        { href: "/admin/services", label: nav.services },
        { href: "/admin/orders", label: nav.orders },
        { href: "/admin/disputes", label: getMarketplaceTexts(locale).nav.disputes },
        { href: "/dashboard", label: nav.myDashboard },
      ]}
    >
      {needsAttention > 0 && (
        <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-sm font-bold text-amber-900">
              {needsAttention} {plural(needsAttention, t.pendingOne, t.pendingMany)}
            </p>
            <p className="mt-1 text-sm text-amber-800">
              {s.openDisputes} {plural(s.openDisputes, t.disputeOne, t.disputeMany)} · {s.pendingVerifications}{" "}
              {plural(s.pendingVerifications, t.verificationOne, t.verificationMany)}
            </p>
          </div>
          {s.pendingVerifications > 0 && (
            <a href="/admin/verifications" className="shrink-0 rounded-full bg-amber-900 px-5 py-2 text-center text-sm font-semibold text-white hover:bg-amber-800">
              {t.processKyc}
            </a>
          )}
        </div>
      )}

      <section>
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-[var(--subtle)]">{t.volumeTitle}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label={t.volume} value={formatMoney(s.gmvMinor, s.currency, locale)} hint={t.volumeHint} accent />
          <StatCard label={t.commission} value={formatMoney(s.commissionMinor, s.currency, locale)} hint={t.commissionHint} />
          <StatCard label={t.orders} value={String(s.orders)} hint={`${s.completedOrders} ${t.completed}`} />
          <StatCard label={t.completion} value={s.orders > 0 ? `${Math.round((s.completedOrders / s.orders) * 100)} %` : "—"} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-[var(--subtle)]">{t.offerTitle}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label={t.accounts} value={String(s.users)} hint={`${s.providers} ${t.providers}`} />
          <StatCard label={t.services} value={String(s.services)} hint={`${s.activeServices} ${t.published}`} />
          <StatCard label={t.openDisputes} value={String(s.openDisputes)} />
          <StatCard label={t.pendingVerifications} value={String(s.pendingVerifications)} />
          <a href="/admin/services" className="block">
            <StatCard label={t.draftServices} value={String(s.draftServices)} hint={t.draftServicesHint} />
          </a>
        </div>
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="font-display text-base font-bold">{t.recentUsers}</h2>
          {s.recentUsers.length === 0 ? (
            <div className="mt-4"><EmptyState title={t.noUsers} body={t.noUsersBody} /></div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--subtle)]">
                  <tr>
                    <th className="px-5 py-3 font-medium">{t.colName}</th>
                    <th className="px-5 py-3 font-medium">{t.colRole}</th>
                    <th className="px-5 py-3 font-medium">{t.colCountry}</th>
                  </tr>
                </thead>
                <tbody>
                  {s.recentUsers.map((u, i) => (
                    <tr key={u.id} className={i < s.recentUsers.length - 1 ? "border-b border-[var(--border)]" : ""}>
                      <td className="px-5 py-3.5">
                        <p className="font-medium">{u.display_name ?? "—"}</p>
                        <p className="text-xs text-[var(--subtle)]">{u.email}</p>
                      </td>
                      <td className="px-5 py-3.5 text-[var(--subtle)]">{getAdminTexts(locale).roles[u.role] ?? u.role}</td>
                      <td className="px-5 py-3.5 text-[var(--subtle)]">{u.country_code}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <h2 className="font-display text-base font-bold">{t.recentOrders}</h2>
          {s.recentOrders.length === 0 ? (
            <div className="mt-4"><EmptyState title={t.noOrders} body={t.noOrdersBody} /></div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--subtle)]">
                  <tr>
                    <th className="px-5 py-3 font-medium">{t.colReference}</th>
                    <th className="px-5 py-3 font-medium">{t.colStatus}</th>
                    <th className="px-5 py-3 text-right font-medium">{t.colAmount}</th>
                  </tr>
                </thead>
                <tbody>
                  {s.recentOrders.map((o, i) => (
                    <tr key={o.id} className={i < s.recentOrders.length - 1 ? "border-b border-[var(--border)]" : ""}>
                      <td className="px-5 py-3.5 font-medium">{o.reference}</td>
                      <td className="px-5 py-3.5">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(o.status)}`}>
                          {statusLabel[o.status] ?? o.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-display font-bold">{formatMoney(BigInt(o.amount_minor), o.currency, locale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-base font-bold">{t.auditTitle}</h2>
        <p className="mt-1 text-sm text-[var(--subtle)]">{t.auditBody}</p>
        {audit.length === 0 ? (
          <div className="mt-4"><EmptyState title={t.auditEmpty} body={t.auditEmptyBody} /></div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--background)]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--subtle)]">
                <tr>
                  <th className="px-5 py-3 font-medium">{t.colWhen}</th>
                  <th className="px-5 py-3 font-medium">{t.colActor}</th>
                  <th className="px-5 py-3 font-medium">{t.colAction}</th>
                  <th className="px-5 py-3 font-medium">{t.colTarget}</th>
                </tr>
              </thead>
              <tbody>
                {audit.map((row, i) => (
                  <tr key={row.id} className={i < audit.length - 1 ? "border-b border-[var(--border)]" : ""}>
                    <td className="whitespace-nowrap px-5 py-3.5 text-[var(--subtle)]">
                      {new Date(row.created_at).toLocaleString(locale === "fr" ? "fr-FR" : "en-GB", {
                        dateStyle: "short",
                        timeStyle: "short",
                        timeZone: "Africa/Abidjan",
                      })}
                    </td>
                    <td className="px-5 py-3.5">{row.actor_name}</td>
                    <td className="px-5 py-3.5">{t.auditActions[row.action] ?? row.action}</td>
                    <td className="px-5 py-3.5 text-[var(--subtle)]">
                      {t.targetTypes[row.target_type] ?? row.target_type} · {row.target_id.slice(0, 8)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </DashboardShell>
  );
}

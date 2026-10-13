import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getAdminStats } from "@/lib/admin-stats";
import { getRecentAdminActions } from "@/lib/admin-audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminNavGroups } from "@/lib/admin-nav";
import { EmptyState } from "@/components/dashboard/shell";
import { OrderTrendChart } from "@/components/admin/order-trend-chart";
import {
  Avatar,
  Pill,
  ProStat,
  ProgressBar,
  Section,
  TableCard,
  orderTone,
  type Tone,
} from "@/components/dashboard/pro";
import { formatMoney } from "@/lib/money";
import { getAdminTexts } from "@/i18n/admin";
import { visitorLocale } from "@/i18n/server-locale";
import { getDashboardTexts } from "@/i18n/dashboard";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getAdminTexts(await visitorLocale()).overview.title };
}
export const dynamic = "force-dynamic";

function roleTone(role: string): Tone {
  if (role === "admin") return "warning";
  if (role === "provider") return "brand";
  if (role === "both") return "info";
  return "neutral";
}

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
  const completionPct = s.orders > 0 ? Math.round((s.completedOrders / s.orders) * 100) : null;

  return (
    <AdminShell
      user={user}
      locale={locale}
      kicker="Administration"
      title={t.title}
      subtitle={t.subtitle}
      actions={
        s.pendingVerifications > 0 ? (
          <Link href="/admin/verifications" className="btn-primary">
            {t.processKyc}
          </Link>
        ) : undefined
      }
      nav={getAdminNavGroups(locale, "/admin")}
    >
      {needsAttention > 0 && (
        <div className="mb-8 flex flex-col gap-4 rounded-2xl bg-[var(--tone-warning-bg)] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[var(--color-gold-500)] text-white"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </span>
            <div>
              <p className="font-display text-sm font-bold text-[var(--tone-warning-fg)]">
                {needsAttention} {plural(needsAttention, t.pendingOne, t.pendingMany)}
              </p>
              <p className="mt-1 text-sm text-[var(--tone-warning-fg)] opacity-90">
                {s.openDisputes} {plural(s.openDisputes, t.disputeOne, t.disputeMany)} ·{" "}
                {s.pendingVerifications}{" "}
                {plural(s.pendingVerifications, t.verificationOne, t.verificationMany)}
              </p>
            </div>
          </div>
          {s.pendingVerifications > 0 && (
            <Link
              href="/admin/verifications"
              className="shrink-0 rounded-full bg-[var(--foreground)] px-5 py-2.5 text-center text-sm font-semibold text-[var(--background)]"
            >
              {t.processKyc}
            </Link>
          )}
        </div>
      )}

      <section>
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-[var(--subtle)]">
          {t.volumeTitle}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ProStat
            tone="gold"
            icon={
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
            }
            label={t.volume}
            value={formatMoney(s.gmvMinor, s.currency, locale)}
            hint={t.volumeHint}
          />
          <ProStat
            tone="brand"
            icon={
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.04 2.04 0 00-.606-1.683 1 1 0 00-1.415 1.414 4.04 4.04 0 001.306 2.906 4.04 4.04 0 002.906 1.306c1.08 0 2.116-.423 2.906-1.306a4.04 4.04 0 001.306-2.906 4.04 4.04 0 00-1.306-2.906 4.04 4.04 0 00-1.683-.606c.452-.226.936-.505 1.45-.837.512-.33 1.03-.718 1.495-1.152a1 1 0 00-.385-1.45zM7 9a2 2 0 100-4 2 2 0 000 4zm11 5a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            }
            label={t.commission}
            value={formatMoney(s.commissionMinor, s.currency, locale)}
            hint={t.commissionHint}
          />
          <ProStat
            icon={
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
              </svg>
            }
            label={t.orders}
            value={String(s.orders)}
            hint={`${s.completedOrders} ${t.completed}`}
          />
          <ProStat
            icon={
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
              </svg>
            }
            label={t.completion}
            value={completionPct !== null ? `${completionPct} %` : "—"}
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-[var(--subtle)]">
          {t.offerTitle}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ProStat
            icon={
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zm8 0a3 3 0 11-6 0 3 3 0 016 0zM2 16a6 6 0 0112 0H2zm14 0a6 6 0 00-9.33-5.26A6.001 6.001 0 0118 16h-2z" />
              </svg>
            }
            label={t.accounts}
            value={String(s.users)}
            hint={`${s.providers} ${t.providers}`}
          />
          <ProStat
            icon={
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
              </svg>
            }
            label={t.services}
            value={String(s.services)}
            hint={`${s.activeServices} ${t.published}`}
          />
          <ProStat
            tone="gold"
            icon={
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            }
            label={t.openDisputes}
            value={String(s.openDisputes)}
          />
          <ProStat
            tone="gold"
            icon={
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            }
            label={t.pendingVerifications}
            value={String(s.pendingVerifications)}
          />
        </div>
      </section>

      <div className="mt-4">
        <Link
          href="/admin/services"
          className="group flex items-center justify-between gap-3 rounded-2xl border border-dashed border-[var(--border)] px-5 py-3.5 text-sm transition-colors hover:border-[var(--color-gold-400)]"
        >
          <span className="font-semibold">
            {s.draftServices} {t.draftServices.toLowerCase()}
          </span>
          <span className="text-xs text-[var(--subtle)] transition-transform group-hover:translate-x-0.5">
            {t.draftServicesHint} →
          </span>
        </Link>
      </div>

      {/* Tendance 30 jours + pays */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Section title={locale === "en" ? "Orders — last 30 days" : "Commandes — 30 derniers jours"}>
          <OrderTrendChart
            data={s.dailyOrders}
            label={locale === "en" ? "Orders — last 30 days" : "Commandes — 30 derniers jours"}
            emptyLabel={locale === "en" ? "No orders yet" : "Aucune commande encore"}
          />
        </Section>

        <Section title={locale === "en" ? "Countries" : "Pays"}>
          {s.countryBreakdown.length === 0 ? (
            <p className="text-sm text-[var(--subtle)]">{t.noUsers}</p>
          ) : (
            <ul className="space-y-3">
              {s.countryBreakdown.map((c) => {
                const pct = s.users > 0 ? Math.round((c.total / s.users) * 100) : 0;
                return (
                  <li key={c.country_code} className="flex items-center gap-3">
                    <span className="w-8 text-sm font-bold">{c.country_code}</span>
                    <div className="flex-1">
                      <ProgressBar value={pct} />
                    </div>
                    <span className="w-16 text-right text-xs text-[var(--subtle)]">
                      {c.total} ({pct} %)
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {s.recentUsers.length === 0 ? (
          <Section title={t.recentUsers}>
            <EmptyState title={t.noUsers} body={t.noUsersBody} />
          </Section>
        ) : (
          <TableCard
            title={t.recentUsers}
            action={
              <Link
                href="/admin/users"
                className="shrink-0 text-sm font-semibold text-[var(--color-brand-600)] hover:underline"
              >
                {nav.users}
              </Link>
            }
          >
            <thead>
              <tr>
                <th>{t.colName}</th>
                <th>{t.colRole}</th>
                <th>{t.colCountry}</th>
              </tr>
            </thead>
            <tbody>
              {s.recentUsers.map((u) => (
                <tr key={u.id}>
                  <td className="whitespace-normal!">
                    <span className="font-semibold">{u.display_name ?? "—"}</span>
                    <span className="block text-xs text-[var(--subtle)]">{u.email}</span>
                  </td>
                  <td>
                    <Pill tone={roleTone(u.role)}>
                      {getAdminTexts(locale).roles[u.role] ?? u.role}
                    </Pill>
                  </td>
                  <td className="text-[var(--subtle)]">{u.country_code}</td>
                </tr>
              ))}
            </tbody>
          </TableCard>
        )}

        {s.recentOrders.length === 0 ? (
          <Section title={t.recentOrders}>
            <EmptyState title={t.noOrders} body={t.noOrdersBody} />
          </Section>
        ) : (
          <TableCard
            title={t.recentOrders}
            action={
              <Link
                href="/admin/orders"
                className="shrink-0 text-sm font-semibold text-[var(--color-brand-600)] hover:underline"
              >
                {nav.orders}
              </Link>
            }
          >
            <thead>
              <tr>
                <th>{t.colReference}</th>
                <th>{t.colStatus}</th>
                <th className="text-right">{t.colAmount}</th>
              </tr>
            </thead>
            <tbody>
              {s.recentOrders.map((o) => (
                <tr key={o.id}>
                  <td className="font-semibold">{o.reference}</td>
                  <td>
                    <Pill tone={orderTone(o.status)}>{statusLabel[o.status] ?? o.status}</Pill>
                  </td>
                  <td className="text-right font-display font-bold">
                    {formatMoney(BigInt(o.amount_minor), o.currency, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableCard>
        )}
      </div>

      {audit.length === 0 ? (
        <div className="mt-6">
          <Section title={t.auditTitle} subtitle={t.auditBody}>
            <EmptyState title={t.auditEmpty} body={t.auditEmptyBody} />
          </Section>
        </div>
      ) : (
        <div className="mt-6">
          <TableCard title={t.auditTitle} subtitle={t.auditBody}>
            <thead>
              <tr>
                <th>{t.colWhen}</th>
                <th>{t.colActor}</th>
                <th>{t.colAction}</th>
                <th>{t.colTarget}</th>
              </tr>
            </thead>
            <tbody>
              {audit.map((row) => (
                <tr key={row.id}>
                  <td className="text-[var(--subtle)]">
                    {new Date(row.created_at).toLocaleString(locale === "fr" ? "fr-FR" : "en-GB", {
                      dateStyle: "short",
                      timeStyle: "short",
                      timeZone: "Africa/Abidjan",
                    })}
                  </td>
                  <td>
                    <span className="flex items-center gap-2">
                      <Avatar name={row.actor_name} size="sm" />
                      <span className="font-semibold">{row.actor_name}</span>
                    </span>
                  </td>
                  <td>{t.auditActions[row.action] ?? row.action}</td>
                  <td className="text-[var(--subtle)]">
                    {t.targetTypes[row.target_type] ?? row.target_type} · {row.target_id.slice(0, 8)}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableCard>
        </div>
      )}
    </AdminShell>
  );
}

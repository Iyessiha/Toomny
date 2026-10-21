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
import type { Locale } from "@/i18n/dictionaries";

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

/** Lien de la cible d'une action du journal, quand une fiche existe. */
function auditTargetHref(type: string, id: string): string | null {
  if (type === "order") return `/admin/orders/${id}`;
  if (type === "service") return `/admin/services/${id}`;
  if (type === "dispute") return "/admin/disputes";
  if (type === "payout") return "/admin/payouts";
  if (type === "verification") return "/admin/verifications";
  return null;
}

/** Variation en % entre deux périodes ; rien à afficher si la période précédente est vide. */
function deltaOf(last: number, prev: number, suffix: string) {
  if (prev === 0) return undefined;
  const pct = Math.round(((last - prev) / prev) * 100);
  return { text: `${pct > 0 ? "+" : ""}${pct} % ${suffix}`, up: pct >= 0 };
}

function fill(template: string, vars: Record<string, string | number>) {
  return Object.entries(vars).reduce((acc, [k, v]) => acc.replace(`{${k}}`, String(v)), template);
}

function TodoCard({
  href,
  label,
  count,
  hint,
  openLabel,
  urgent = false,
}: {
  href: string;
  label: string;
  count: number;
  hint: string;
  openLabel: string;
  urgent?: boolean;
}) {
  const active = count > 0;
  const surface = !active
    ? "border-[var(--border)] bg-[var(--background)]"
    : urgent
      ? "border-transparent bg-[var(--tone-danger-bg)]"
      : "border-transparent bg-[var(--tone-warning-bg)]";
  const ink = active ? (urgent ? "text-[var(--tone-danger-fg)]" : "text-[var(--tone-warning-fg)]") : "text-[var(--foreground)]";
  return (
    <Link href={href} className={`app-lift group flex flex-col gap-3 rounded-2xl border p-5 ${surface}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--subtle)]">{label}</span>
        <span className="text-xs font-semibold text-[var(--subtle)] opacity-0 transition-opacity group-hover:opacity-100">
          {openLabel} →
        </span>
      </div>
      <div className="flex items-end gap-2">
        <span className={`font-display text-3xl font-bold ${ink}`}>{count}</span>
        <span className="pb-1 text-xs text-[var(--subtle)]">{hint}</span>
      </div>
    </Link>
  );
}

export default async function AdminPage() {
  const user = await requireAdmin();
  const locale: Locale = user.preferredLocale;
  const t = getAdminTexts(locale).overview;
  const nav = getAdminTexts(locale).nav;
  const statusLabel = getDashboardTexts(locale).status;
  const s = await getAdminStats();
  const audit = await getRecentAdminActions(createAdminClient());
  const c = s.counts;
  const fmt = (n: number) => n.toLocaleString(locale === "en" ? "en-GB" : "fr-FR");

  const queuedPayouts = c.queuedPayouts;
  const todoTotal = c.pendingKyc + c.draftServices + c.openDisputes + c.overdueOrders + queuedPayouts + c.failedPayouts;

  const orderDelta = deltaOf(s.trend.ordersLast7, s.trend.ordersPrev7, t.vsPrev);
  const volumeDelta = deltaOf(Number(s.trend.amountLast7), Number(s.trend.amountPrev7), t.vsPrev);

  return (
    <AdminShell
      user={user}
      locale={locale}
      kicker={t.kicker}
      title={t.title}
      subtitle={t.subtitle}
      actions={
        c.pendingKyc > 0 ? (
          <Link href="/admin/verifications" className="btn-primary">
            {t.processKyc}
          </Link>
        ) : undefined
      }
      nav={getAdminNavGroups(locale, "/admin")}
    >
      {/* ── À traiter : ce qui demande une action aujourd'hui ── */}
      <Section
        title={t.todoTitle}
        action={
          <Pill tone={todoTotal > 0 ? "warning" : "success"}>
            {todoTotal > 0 ? fmt(todoTotal) : t.todoOk}
          </Pill>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <TodoCard
            href="/admin/verifications"
            label={t.todoKyc}
            count={c.pendingKyc}
            hint={t.todoKycHint}
            openLabel={t.open}
          />
          <TodoCard
            href="/admin/services?status=draft"
            label={t.todoServices}
            count={c.draftServices}
            hint={t.todoServicesHint}
            openLabel={t.open}
          />
          <TodoCard
            href="/admin/disputes"
            label={t.todoDisputes}
            count={c.openDisputes}
            hint={fill(t.todoDisputesHint, { n: c.staleDisputes })}
            openLabel={t.open}
            urgent={c.staleDisputes > 0}
          />
          <TodoCard
            href="/admin/orders"
            label={t.todoOrders}
            count={c.overdueOrders}
            hint={t.todoOrdersHint}
            openLabel={t.open}
            urgent={c.overdueOrders > 0}
          />
          <TodoCard
            href="/admin/payouts"
            label={t.todoPayouts}
            count={queuedPayouts + c.failedPayouts}
            hint={fill(t.todoPayoutsHint, { q: queuedPayouts, f: c.failedPayouts })}
            openLabel={t.open}
            urgent={c.failedPayouts > 0}
          />
        </div>
      </Section>

      {/* ── Volume : argent réellement acquis séparé de l'argent en séquestre ── */}
      <section className="mt-10">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-[var(--subtle)]">{t.volumeTitle}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ProStat
            tone="gold"
            icon={
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
            }
            label={t.volume}
            value={formatMoney(s.gmvMinor, s.currency, locale)}
            hint={t.volumeHint}
            delta={volumeDelta}
          />
          <ProStat
            tone="brand"
            icon={
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm3.707 5.293a1 1 0 00-1.414 0L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 000-1.414z" clipRule="evenodd" />
              </svg>
            }
            label={t.collected}
            value={formatMoney(s.commissionCollectedMinor, s.currency, locale)}
            hint={t.collectedHint}
          />
          <ProStat
            icon={
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 4a1 1 0 10-2 0v4a1 1 0 00.293.707l2.5 2.5a1 1 0 001.414-1.414L11 9.586V6z" clipRule="evenodd" />
              </svg>
            }
            label={t.pending}
            value={formatMoney(s.commissionPendingMinor, s.currency, locale)}
            hint={t.pendingHint}
          />
          <ProStat
            icon={
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
              </svg>
            }
            label={t.completion}
            value={s.completionPct !== null ? `${s.completionPct} %` : "—"}
            hint={fill(t.completionHint, { n: fmt(s.paidOrders) })}
          />
        </div>
      </section>

      {/* ── Offre et demande ── */}
      <section className="mt-10">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-[var(--subtle)]">{t.offerTitle}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ProStat
            icon={
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zm8 0a3 3 0 11-6 0 3 3 0 016 0zM2 16a6 6 0 0112 0H2zm14 0a6 6 0 00-9.33-5.26A6.001 6.001 0 0118 16h-2z" />
              </svg>
            }
            label={t.accounts}
            value={fmt(s.users)}
            hint={`${fmt(s.providers)} ${t.providers} · +${fmt(c.newUsers7d)} ${t.newAccounts}`}
          />
          <ProStat
            icon={
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5z" clipRule="evenodd" />
                <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
              </svg>
            }
            label={t.services}
            value={fmt(s.services)}
            hint={`${fmt(s.activeServices)} ${t.published}`}
          />
          <ProStat
            icon={
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
              </svg>
            }
            label={t.orders}
            value={fmt(s.orders)}
            hint={`${fmt(s.completedOrders)} ${t.completed}`}
          />
          <ProStat
            tone="brand"
            icon={
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm3 3h8v2H6V6zm0 4h8v2H6v-2z" clipRule="evenodd" />
              </svg>
            }
            label={t.ordersLast7}
            value={fmt(s.trend.ordersLast7)}
            hint={t.last7}
            delta={orderDelta}
          />
        </div>
      </section>

      {/* ── Tendance 30 jours + pays ── */}
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Section title={t.trendTitle}>
          <OrderTrendChart data={s.dailyOrders} label={t.trendTitle} emptyLabel={t.noOrdersYet} />
        </Section>

        <Section title={t.countriesTitle}>
          {s.countryBreakdown.length === 0 ? (
            <p className="text-sm text-[var(--subtle)]">{t.noUsers}</p>
          ) : (
            <ul className="space-y-3">
              {s.countryBreakdown.map((row) => {
                const pct = s.users > 0 ? Math.round((row.total / s.users) * 100) : 0;
                return (
                  <li key={row.country_code} className="flex items-center gap-3">
                    <span className="w-8 text-sm font-bold">{row.country_code}</span>
                    <div className="flex-1">
                      <ProgressBar value={pct} />
                    </div>
                    <span className="w-16 text-right text-xs text-[var(--subtle)]">
                      {row.total} ({pct} %)
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>
      </div>

      {/* ── Derniers inscrits et dernières commandes, cliquables ── */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {s.recentUsers.length === 0 ? (
          <Section title={t.recentUsers}>
            <EmptyState title={t.noUsers} body={t.noUsersBody} />
          </Section>
        ) : (
          <TableCard
            title={t.recentUsers}
            action={
              <Link href="/admin/users" className="shrink-0 text-sm font-semibold text-[var(--color-brand-600)] hover:underline">
                {t.latestAllUsers}
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
                    <Link href={`/admin/users/${u.id}`} className="font-semibold hover:underline">
                      {u.display_name ?? "—"}
                    </Link>
                    <span className="block text-xs text-[var(--subtle)]">{u.email}</span>
                  </td>
                  <td>
                    <Pill tone={roleTone(u.role)}>{getAdminTexts(locale).roles[u.role] ?? u.role}</Pill>
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
              <Link href="/admin/orders" className="shrink-0 text-sm font-semibold text-[var(--color-brand-600)] hover:underline">
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
                  <td className="font-semibold">
                    <Link href={`/admin/orders/${o.id}`} className="hover:underline">
                      {o.reference}
                    </Link>
                  </td>
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

      {/* ── Journal ── */}
      <div className="mt-6">
        {audit.length === 0 ? (
          <Section title={t.auditTitle} subtitle={t.auditBody}>
            <EmptyState title={t.auditEmpty} body={t.auditEmptyBody} />
          </Section>
        ) : (
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
              {audit.map((row) => {
                const href = auditTargetHref(row.target_type, row.target_id);
                const targetText = `${t.targetTypes[row.target_type] ?? row.target_type} · ${row.target_id.slice(0, 8)}`;
                return (
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
                      {href ? (
                        <Link href={href} className="hover:text-[var(--foreground)] hover:underline">
                          {targetText}
                        </Link>
                      ) : (
                        targetText
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableCard>
        )}
      </div>
    </AdminShell>
  );
}

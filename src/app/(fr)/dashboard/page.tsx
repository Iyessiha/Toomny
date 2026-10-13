import Link from "next/link";
import type { Metadata } from "next";
import { getPublicPageTexts } from "@/i18n/public-pages";
import { visitorLocale } from "@/i18n/server-locale";
import { requireAuth, isProvider } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";
import { DashboardShell, EmptyState } from "@/components/dashboard/shell";
import { dashboardNavSections } from "@/lib/dashboard-nav";
import {
  Avatar,
  Pill,
  ProStat,
  QuickAction,
  Section,
  TableCard,
  orderTone,
  serviceTone,
} from "@/components/dashboard/pro";
import { formatMoney } from "@/lib/money";
import { getDashboardTexts } from "@/i18n/dashboard";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/i18n/dictionaries";
import { AutoRefresh } from "@/components/dashboard/auto-refresh";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getPublicPageTexts(await visitorLocale()).titles.dashboard };
}
export const dynamic = "force-dynamic";

type ServicePreview = {
  id: string;
  title: string;
  status: string;
  price_minor: number;
};

export default async function DashboardPage() {
  const user = await requireAuth();
  const data = await getDashboardData(user);
  const provider = isProvider(user.role);

  if (provider) {
    const supabase = await createClient();
    const { data: services } = await supabase
      .from("services")
      .select("id, title, status, price_minor")
      .eq("provider_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);
    return (
      <>
        <AutoRefresh />
        <ProviderDashboard user={user} data={data} services={(services ?? []) as ServicePreview[]} />
      </>
    );
  }
  return (
    <>
      <AutoRefresh />
      <ClientDashboard user={user} data={data} />
    </>
  );
}

type User = Awaited<ReturnType<typeof requireAuth>>;
type Data = Awaited<ReturnType<typeof getDashboardData>>;

// ---------------------------------------------------------------------------
// Dashboard PRESTATAIRE
// ---------------------------------------------------------------------------
function ProviderDashboard({ user, data, services }: { user: User; data: Data; services: ServicePreview[] }) {
  const locale: Locale = user.preferredLocale;
  const t = getDashboardTexts(locale);
  const cur = data.currency;
  const kycDone = user.verificationStatus === "verified";
  const kycPending = user.verificationStatus === "pending" || user.verificationStatus === "manual_review";
  const kycRejected = user.verificationStatus === "rejected";
  const firstName = user.firstName ?? user.displayName?.split(" ")[0] ?? "";

  return (
    <DashboardShell
      user={user}
      locale={locale}
      kicker={t.nav.overview}
      title={`${t.provider.greeting} ${firstName}`}
      subtitle={t.provider.subtitle}
      actions={
        <>
          <Link href="/dashboard/prestations/nouveau" className="btn-primary">
            {t.provider.publishTitle}
          </Link>
          <Link href="/dashboard/versements" className="btn-secondary">
            {t.provider.payoutsTitle}
          </Link>
        </>
      }
      navSections={dashboardNavSections(t.nav, user.role, "/dashboard")}
    >
      {!kycDone && !kycPending && (
        <div className="mb-8 flex flex-col gap-4 rounded-2xl bg-[var(--tone-warning-bg)] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-sm font-bold text-[var(--tone-warning-fg)]">
              {kycRejected ? t.provider.kycRejectedTitle : t.provider.kycBlockedTitle}
            </p>
            <p className="mt-1 text-sm text-[var(--tone-warning-fg)] opacity-90">
              {kycRejected ? t.provider.kycRejectedBody : t.provider.kycBlockedBody}
            </p>
          </div>
          <Link
            href="/dashboard/verification"
            className="shrink-0 rounded-full bg-[var(--foreground)] px-5 py-2.5 text-center text-sm font-semibold text-[var(--background)]"
          >
            {kycRejected ? t.provider.kycResubmit : t.provider.kycCta}
          </Link>
        </div>
      )}

      {kycPending && (
        <div className="mb-8 rounded-2xl bg-[var(--tone-info-bg)] px-5 py-4 text-sm text-[var(--tone-info-fg)]">
          <strong>{t.provider.kycPending}</strong> — {t.provider.kycPendingBody}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ProStat
          tone="brand"
          icon={
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
            </svg>
          }
          label={t.provider.statEarned}
          value={formatMoney(data.earnedMinor, cur, locale)}
          hint={t.provider.statEarnedHint}
        />
        <ProStat
          tone="gold"
          icon={
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          }
          label={t.provider.statPending}
          value={formatMoney(data.pendingMinor, cur, locale)}
          hint={t.provider.statPendingHint}
        />
        <ProStat
          icon={
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
              <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
            </svg>
          }
          label={t.provider.statServices}
          value={String(data.servicesCount)}
          hint={t.provider.statServicesHint}
        />
        <ProStat
          icon={
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
              <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
            </svg>
          }
          label={t.provider.statOrders}
          value={String(data.orders.length)}
          hint={t.provider.statOrdersHint}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <OrdersTable
            user={user}
            data={data}
            locale={locale}
            title={t.provider.ordersReceived}
            empty={{
              title: t.provider.noOrdersTitle,
              body: t.provider.noOrdersBody,
              action: { href: "/dashboard/prestations", label: t.provider.publishTitle },
            }}
          />
        </div>
        <div className="space-y-4 lg:col-span-2">
          <Section title={t.provider.profileCard}>
            <div className="flex items-center gap-3">
              <Avatar name={user.displayName ?? user.email} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{user.displayName ?? "—"}</p>
                <p className="truncate text-xs text-[var(--subtle)]">
                  {user.city ? `${user.city} · ` : ""}
                  {user.countryCode}
                </p>
              </div>
              <span className="ml-auto">
                <Pill tone={kycDone ? "success" : "warning"}>
                  {kycDone ? t.provider.verifiedShort : t.provider.verificationRequired}
                </Pill>
              </span>
            </div>
            {user.phone && <p className="mt-3 text-xs text-[var(--subtle)]">{user.phone}</p>}
          </Section>

          <Link
            href="/dashboard/prestations/nouveau"
            className="app-lift group flex items-center gap-4 rounded-2xl bg-[var(--tone-warning-bg)] p-5"
          >
            <span
              aria-hidden
              className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-[var(--color-gold-500)] text-white transition-transform group-hover:scale-105"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-[var(--tone-warning-fg)]">
                {t.provider.publishTitle}
              </span>
              <span className="block text-xs text-[var(--tone-warning-fg)] opacity-80">
                {t.provider.publishHint}
              </span>
            </span>
          </Link>

          <QuickAction
            href="/dashboard/versements"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
              </svg>
            }
            title={t.provider.payoutsTitle}
            desc={t.provider.payoutsHint}
          />
        </div>
      </div>

      <div className="mt-6">
        <ServicesPreviewList services={services} locale={locale} t={t} />
      </div>
    </DashboardShell>
  );
}

// ---------------------------------------------------------------------------
// Mini-liste prestations (provider dashboard)
// ---------------------------------------------------------------------------
function ServicesPreviewList({
  services,
  locale,
  t,
}: {
  services: ServicePreview[];
  locale: Locale;
  t: ReturnType<typeof getDashboardTexts>;
}) {
  return (
    <Section
      title={t.nav.services}
      action={
        <Link
          href="/dashboard/prestations"
          className="shrink-0 text-sm font-semibold text-[var(--color-brand-600)] hover:underline"
        >
          {t.common.viewAll}
        </Link>
      }
      flush={services.length > 0}
    >
      {services.length === 0 ? (
        <EmptyState
          title={t.provider.noServicesTitle}
          body={t.provider.noServicesBody}
          action={{ href: "/dashboard/prestations", label: t.provider.publishTitle }}
        />
      ) : (
        <ul className="divide-y divide-[var(--border)]">
          {services.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-[var(--surface)]"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{s.title}</p>
                <p className="mt-0.5 text-xs text-[var(--subtle)]">
                  {s.price_minor.toLocaleString(locale === "en" ? "en-US" : "fr-FR")} FCFA
                </p>
              </div>
              <Pill tone={serviceTone(s.status)}>
                {t.service[s.status as keyof typeof t.service] ?? s.status}
              </Pill>
              <Link
                href="/dashboard/prestations"
                className="shrink-0 rounded-full border border-[var(--border)] px-3.5 py-1.5 text-xs font-semibold transition-colors hover:border-[var(--color-brand-400)] hover:text-[var(--color-brand-600)]"
              >
                {t.services.edit}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Dashboard CLIENT
// ---------------------------------------------------------------------------
function ClientDashboard({ user, data }: { user: User; data: Data }) {
  const locale: Locale = user.preferredLocale;
  const t = getDashboardTexts(locale);
  const cur = data.currency;
  const inProgress = data.orders.filter((o) => !["completed", "cancelled", "refunded"].includes(o.status)).length;
  const completed = data.orders.filter((o) => o.status === "completed").length;
  const firstName = user.firstName ?? user.displayName?.split(" ")[0] ?? "";

  return (
    <DashboardShell
      user={user}
      locale={locale}
      kicker={t.nav.home}
      title={`${t.client.greeting} ${firstName}`}
      subtitle={t.client.subtitle}
      actions={
        <Link href="/services" className="btn-primary">
          {t.client.ctaButton}
        </Link>
      }
      navSections={dashboardNavSections(t.nav, user.role, "/dashboard")}
    >
      <div className="hero-band relative mb-8 overflow-hidden rounded-3xl p-6 sm:p-8">
        <div aria-hidden className="texture-dots absolute inset-0" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-bold sm:text-2xl">{t.client.ctaTitle}</h2>
            <p className="hero-subtle mt-1 max-w-md text-sm">{t.client.ctaBody}</p>
          </div>
          <Link href="/services" className="btn-gold shrink-0">
            {t.client.ctaButton}
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <ProStat
          tone="gold"
          icon={
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
            </svg>
          }
          label={t.client.statSpent}
          value={formatMoney(data.spentMinor, cur, locale)}
          hint={t.client.statSpentHint}
        />
        <ProStat
          tone="brand"
          icon={
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          }
          label={t.client.statInProgress}
          value={String(inProgress)}
          hint={t.client.statInProgressHint}
        />
        <ProStat
          icon={
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          }
          label={t.client.statDone}
          value={String(completed)}
          hint={t.client.statDoneHint}
        />
      </div>

      <div className="mt-6">
        <OrdersTable
          user={user}
          data={data}
          locale={locale}
          title={t.client.myOrders}
          empty={{
            title: t.client.noOrdersTitle,
            body: t.client.noOrdersBody,
            action: { href: "/services", label: t.client.noOrdersCta },
          }}
        />
      </div>

      <div className="mt-6 rounded-2xl bg-[var(--tone-warning-bg)] p-6">
        <p className="font-display text-base font-bold text-[var(--tone-warning-fg)]">
          {t.client.becomeTitle}
        </p>
        <p className="mt-1 text-sm text-[var(--tone-warning-fg)] opacity-90">{t.client.becomeBody}</p>
        <Link
          href="/auth?role=provider"
          className="mt-4 inline-flex rounded-full bg-[var(--foreground)] px-5 py-2.5 text-sm font-semibold text-[var(--background)]"
        >
          {t.client.becomeCta}
        </Link>
      </div>
    </DashboardShell>
  );
}

// ---------------------------------------------------------------------------
// Commandes récentes (commun aux deux rôles)
// ---------------------------------------------------------------------------
function OrdersTable({
  user,
  data,
  locale,
  title,
  empty,
}: {
  user: User;
  data: Data;
  locale: Locale;
  title: string;
  empty: { title: string; body: string; action: { href: string; label: string } };
}) {
  const t = getDashboardTexts(locale);
  const provider = isProvider(user.role);
  const rows = data.orders.slice(0, 8);

  if (rows.length === 0) {
    return (
      <Section title={title}>
        <EmptyState title={empty.title} body={empty.body} action={empty.action} />
      </Section>
    );
  }

  return (
    <TableCard
      title={title}
      action={
        <Link
          href="/orders"
          className="shrink-0 text-sm font-semibold text-[var(--color-brand-600)] hover:underline"
        >
          {t.common.viewAll}
        </Link>
      }
    >
      <thead>
        <tr>
          <th>{t.common.reference}</th>
          <th>{t.common.status}</th>
          <th className="text-right">{provider ? t.common.netForYou : t.common.amount}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((o) => (
          <tr key={o.id}>
            <td className="whitespace-normal! font-semibold">
              <Link href={`/orders/${o.id}`} className="hover:underline">
                {o.reference}
              </Link>
            </td>
            <td>
              <Pill tone={orderTone(o.status)}>{t.status[o.status] ?? o.status}</Pill>
            </td>
            <td className="text-right font-display font-bold">
              {formatMoney(BigInt(provider ? o.provider_net_minor : o.amount_minor), o.currency, locale)}
            </td>
          </tr>
        ))}
      </tbody>
    </TableCard>
  );
}

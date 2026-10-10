import Link from "next/link";
import type { Metadata } from "next";
import { getPublicPageTexts } from "@/i18n/public-pages";
import { visitorLocale } from "@/i18n/server-locale";
import { requireAuth, isProvider } from "@/lib/auth";
import { getDashboardData, statusTone } from "@/lib/dashboard";
import { DashboardShell, StatCard, EmptyState } from "@/components/dashboard/shell";
import { formatMoney } from "@/lib/money";
import { getDashboardTexts } from "@/i18n/dashboard";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/i18n/dictionaries";

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
    return <ProviderDashboard user={user} data={data} services={(services ?? []) as ServicePreview[]} />;
  }
  return <ClientDashboard user={user} data={data} />;
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
      title={`${t.provider.greeting} ${firstName} 👋`}
      subtitle={t.provider.subtitle}
      nav={[
        { href: "/dashboard", label: t.nav.overview, current: true },
        { href: "/dashboard/prestations", label: t.nav.services },
        { href: "/dashboard/profil", label: t.nav.profile },
        { href: "/dashboard/verification", label: t.nav.kyc },
        { href: "/orders", label: t.nav.orders },
        { href: "/messages", label: t.nav.messages },
        ...(user.role === "admin" ? [{ href: "/admin", label: t.nav.admin }] : []),
      ]}
    >
      {!kycDone && !kycPending && (
        <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-sm font-bold text-amber-900">
              {kycRejected ? t.provider.kycRejectedTitle : t.provider.kycBlockedTitle}
            </p>
            <p className="mt-1 text-sm text-amber-800">
              {kycRejected ? t.provider.kycRejectedBody : t.provider.kycBlockedBody}
            </p>
          </div>
          <Link
            href="/dashboard/verification"
            className="shrink-0 rounded-full bg-amber-900 px-5 py-2.5 text-center text-sm font-semibold text-white hover:bg-amber-800"
          >
            {kycRejected ? t.provider.kycResubmit : t.provider.kycCta}
          </Link>
        </div>
      )}

      {kycPending && (
        <div className="mb-8 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-800">
          <strong>{t.provider.kycPending}</strong> — {t.provider.kycPendingBody}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t.provider.statEarned} value={formatMoney(data.earnedMinor, cur, locale)} hint={t.provider.statEarnedHint} accent />
        <StatCard label={t.provider.statPending} value={formatMoney(data.pendingMinor, cur, locale)} hint={t.provider.statPendingHint} />
        <StatCard label={t.provider.statServices} value={String(data.servicesCount)} hint={t.provider.statServicesHint} />
        <StatCard label={t.provider.statOrders} value={String(data.orders.length)} hint={t.provider.statOrdersHint} />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--subtle)]">{t.provider.profileCard}</p>
          <p className="mt-2 text-sm font-medium">{user.displayName ?? "—"}</p>
          <p className="text-xs text-[var(--subtle)]">{user.city ? `${user.city} · ` : ""}{user.countryCode}</p>
          {user.phone && <p className="mt-1 text-xs text-[var(--subtle)]">{user.phone}</p>}
          <div className="mt-3 flex items-center gap-2">
            <div className={`h-1.5 w-1.5 rounded-full ${kycDone ? "bg-[var(--color-brand-500)]" : "bg-amber-400"}`} />
            <span className="text-xs text-[var(--subtle)]">{kycDone ? t.provider.verifiedShort : t.provider.verificationRequired}</span>
          </div>
        </div>

        <Link
          href="/dashboard/prestations"
          className="group flex flex-col justify-between rounded-2xl border border-dashed border-[var(--color-brand-300)] bg-[var(--color-brand-50)] p-5 transition-colors hover:bg-[var(--color-brand-100)]"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-brand-500)] text-white">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <div className="mt-4">
            <p className="text-sm font-semibold text-[var(--color-brand-800)]">{t.provider.publishTitle}</p>
            <p className="mt-0.5 text-xs text-[var(--color-brand-600)]">{t.provider.publishHint}</p>
          </div>
        </Link>

        <Link
          href="/dashboard/versements"
          className="flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 transition-colors hover:bg-[var(--surface)]"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface)]">
            <svg className="h-4 w-4 text-[var(--subtle)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
            </svg>
          </div>
          <div className="mt-4">
            <p className="text-sm font-semibold">{t.provider.payoutsTitle}</p>
            <p className="mt-0.5 text-xs text-[var(--subtle)]">{t.provider.payoutsHint}</p>
          </div>
        </Link>
      </div>

      <ServicesPreviewList services={services} locale={locale} t={t} />

      <OrdersTable user={user} data={data} locale={locale} title={t.provider.ordersReceived} empty={{ title: t.provider.noOrdersTitle, body: t.provider.noOrdersBody, action: { href: "/dashboard/prestations", label: t.provider.publishTitle } }} />
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
  function statusBadge(status: string) {
    if (status === "active") return "bg-green-100 text-green-700";
    if (status === "paused") return "bg-yellow-100 text-yellow-700";
    if (status === "removed") return "bg-red-100 text-red-700";
    return "bg-[var(--surface)] text-[var(--subtle)]";
  }

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">{t.nav.services}</h2>
        <Link href="/dashboard/prestations" className="text-sm text-[var(--color-brand-600)] underline underline-offset-4">
          {t.common.viewAll}
        </Link>
      </div>

      {services.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            title={t.provider.noServicesTitle}
            body={t.provider.noServicesBody}
            action={{ href: "/dashboard/prestations", label: t.provider.publishTitle }}
          />
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]">
          {services.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{s.title}</p>
                <p className="mt-0.5 text-xs text-[var(--subtle)]">
                  {(s.price_minor / 1).toLocaleString(locale === "en" ? "en-US" : "fr-FR")} FCFA
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusBadge(s.status)}`}>
                {t.service[s.status as keyof typeof t.service] ?? s.status}
              </span>
              <Link
                href="/dashboard/prestations"
                className="shrink-0 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium transition-colors hover:border-[var(--color-brand-400)] hover:text-[var(--color-brand-600)]"
              >
                {t.services.edit}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
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
      title={`${t.client.greeting} ${firstName} 👋`}
      subtitle={t.client.subtitle}
      nav={[
        { href: "/dashboard", label: t.nav.home, current: true },
        { href: "/services", label: t.nav.findProvider },
        { href: "/orders", label: t.nav.myOrders },
        { href: "/messages", label: t.nav.messages },
        ...(user.role === "admin" ? [{ href: "/admin", label: t.nav.admin }] : []),
      ]}
    >
      <div className="mb-8 flex flex-col gap-4 rounded-2xl bg-[var(--color-brand-500)] p-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold">{t.client.ctaTitle}</h2>
          <p className="mt-1 text-sm text-white/80">{t.client.ctaBody}</p>
        </div>
        <Link href="/services" className="shrink-0 rounded-full bg-white px-6 py-3 text-sm font-bold text-[var(--color-brand-700)] hover:bg-white/90">
          {t.client.ctaButton}
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t.client.statSpent} value={formatMoney(data.spentMinor, cur, locale)} hint={t.client.statSpentHint} accent />
        <StatCard label={t.client.statInProgress} value={String(inProgress)} hint={t.client.statInProgressHint} />
        <StatCard label={t.client.statDone} value={String(completed)} hint={t.client.statDoneHint} />
      </div>

      <OrdersTable user={user} data={data} locale={locale} title={t.client.myOrders} empty={{ title: t.client.noOrdersTitle, body: t.client.noOrdersBody, action: { href: "/services", label: t.client.noOrdersCta } }} />

      <section className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <p className="text-sm font-semibold">{t.client.becomeTitle}</p>
        <p className="mt-1 text-sm text-[var(--subtle)]">{t.client.becomeBody}</p>
        <Link href="/auth?role=provider" className="mt-4 inline-flex rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-[var(--background)]">
          {t.client.becomeCta}
        </Link>
      </section>
    </DashboardShell>
  );
}

// ---------------------------------------------------------------------------
// Tableau des commandes récentes (commun aux deux rôles)
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
  const isProvider = isProviderRole(user);

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">{title}</h2>
        {data.orders.length > 0 && (
          <Link href="/orders" className="text-sm text-[var(--color-brand-600)] underline underline-offset-4">{t.common.viewAll}</Link>
        )}
      </div>

      {data.orders.length === 0 ? (
        <div className="mt-5">
          <EmptyState title={empty.title} body={empty.body} action={empty.action} />
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--subtle)]">
              <tr>
                <th className="px-5 py-3 font-medium">{t.common.reference}</th>
                <th className="px-5 py-3 font-medium">{t.common.status}</th>
                <th className="px-5 py-3 text-right font-medium">{isProvider ? t.common.netForYou : t.common.amount}</th>
              </tr>
            </thead>
            <tbody>
              {data.orders.slice(0, 8).map((o, i) => (
                <tr key={o.id} className={i < Math.min(data.orders.length, 8) - 1 ? "border-b border-[var(--border)]" : ""}>
                  <td className="px-5 py-4 font-medium">
                    <Link href={`/orders/${o.id}`} className="hover:underline">{o.reference}</Link>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(o.status)}`}>
                      {t.status[o.status] ?? o.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right font-display font-bold">
                    {formatMoney(BigInt(isProvider ? o.provider_net_minor : o.amount_minor), o.currency, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function isProviderRole(user: User): boolean {
  return isProvider(user.role);
}

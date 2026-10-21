import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth, isProvider } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell, EmptyState } from "@/components/dashboard/shell";
import { Notice, Pill, ProStat, Section, TableCard, type Tone } from "@/components/dashboard/pro";
import { PlanCheckoutButton } from "@/components/dashboard/plan-checkout-button";
import { dashboardNavSections } from "@/lib/dashboard-nav";
import { getDashboardTexts } from "@/i18n/dashboard";
import { visitorLocale } from "@/i18n/server-locale";
import { getLanding } from "@/content/landing";
import { formatMoney } from "@/lib/money";
import {
  DEFAULT_PLAN,
  PLANS,
  PAID_PLAN_TIERS,
  effectivePlan,
  normalizePlan,
  type PlanTier,
} from "@/lib/plans";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await visitorLocale();
  return { title: getDashboardTexts(locale).plan.metaTitle };
}

function subscriptionTone(status: string): Tone {
  if (status === "active") return "success";
  if (status === "failed") return "danger";
  if (status === "expired") return "neutral";
  return "warning";
}

type SubscriptionRow = {
  id: string;
  plan: string;
  amount_minor: number | string;
  currency: string;
  status: string;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
};

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>;
}) {
  const user = await requireAuth();
  const locale = user.preferredLocale;
  const t = getDashboardTexts(locale);
  const p = t.plan;
  const { payment } = await searchParams;

  // Upsell pour un compte non-prestataire
  if (!isProvider(user.role)) {
    return (
      <DashboardShell
        user={user}
        locale={locale}
        kicker={t.nav.plan}
        title={p.title}
        subtitle={p.subtitle}
        navSections={dashboardNavSections(t.nav, user.role, "/dashboard/plan")}
      >
        <div className="space-y-6">
          <Notice tone="info" title={p.notProviderTitle}>
            {p.notProviderBody}
          </Notice>

          <div className="rounded-2xl bg-[var(--tone-warning-bg)] p-6">
            <p className="font-display text-base font-bold text-[var(--tone-warning-fg)]">
              {t.client.becomeTitle}
            </p>
            <p className="mt-1 text-sm text-[var(--tone-warning-fg)] opacity-90">
              {t.client.becomeBody}
            </p>
            <Link
              href="/auth?role=provider"
              className="mt-4 inline-flex rounded-full bg-[var(--foreground)] px-5 py-2.5 text-sm font-semibold text-[var(--background)]"
            >
              {t.client.becomeCta}
            </Link>
          </div>
        </div>
      </DashboardShell>
    );
  }

  const supabase = await createClient();
  const [{ data: profile }, { data: subRows }] = await Promise.all([
    supabase
      .from("provider_profiles")
      .select("plan, plan_expires_at")
      .eq("profile_id", user.id)
      .maybeSingle(),
    supabase
      .from("subscriptions")
      .select("id, plan, amount_minor, currency, status, period_start, period_end, created_at")
      .eq("provider_id", user.id)
      .order("created_at", { ascending: false })
      .limit(25),
  ]);

  const now = new Date();
  const storedTier = normalizePlan(profile?.plan);
  const activeTier = effectivePlan(profile?.plan, profile?.plan_expires_at ?? null, now);
  const activeSpec = PLANS[activeTier];
  const landingPlans = getLanding(locale).pricing.plans;
  // landingPlans[0] = Débutant (gratuit), [1] = Essentiel, [2] = Pro, [3] = Expert
  const planDisplayNames: Record<PlanTier, string> = {
    debutant: landingPlans[0]?.name ?? p.starterName,
    essentiel: landingPlans[1]?.name ?? "Essentiel",
    pro: landingPlans[2]?.name ?? "Pro",
    expert: landingPlans[3]?.name ?? "Expert",
  };

  const dateTag = locale === "en" ? "en-GB" : "fr-FR";
  const expiresAt = profile?.plan_expires_at ? new Date(profile.plan_expires_at) : null;
  const hasValidPaidExpiry =
    activeTier !== DEFAULT_PLAN &&
    !!expiresAt &&
    Number.isFinite(expiresAt.getTime()) &&
    expiresAt.getTime() > now.getTime();
  const isExpired =
    storedTier !== DEFAULT_PLAN &&
    !!expiresAt &&
    (!Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() <= now.getTime());
  const validityValue = hasValidPaidExpiry
    ? `${p.validUntil} ${expiresAt.toLocaleDateString(dateTag, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })}`
    : isExpired
      ? p.expiredValidity
      : p.defaultValidity;

  const history = (subRows ?? []) as SubscriptionRow[];

  return (
    <DashboardShell
      user={user}
      locale={locale}
      kicker={t.nav.plan}
      title={p.title}
      subtitle={p.subtitle}
      navSections={dashboardNavSections(t.nav, user.role, "/dashboard/plan")}
    >
      {payment === "success" && (
        <div className="mb-6">
          <Notice tone="success" title={p.successTitle}>
            {p.successBody}
          </Notice>
        </div>
      )}
      {payment === "error" && (
        <div className="mb-6">
          <Notice tone="danger" title={p.errorTitle}>
            {p.errorBody}
          </Notice>
        </div>
      )}

      {/* Résumé du plan actif */}
      <div className="grid gap-4 sm:grid-cols-3">
        <ProStat
          tone="gold"
          icon={
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path d="M2.5 5.5L6.5 9.5 10 4l3.5 5.5 4-4L16 14H4L2.5 5.5zM4 15.5h12a.75.75 0 010 1.5H4a.75.75 0 010-1.5z" />
            </svg>
          }
          label={p.currentPlan}
          value={planDisplayNames[activeTier]}
          hint={validityValue}
        />
        <ProStat
          tone="brand"
          icon={
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
              <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
            </svg>
          }
          label={p.commissionRate}
          value={`${activeSpec.commissionPercent} %`}
          hint={p.commissionHint}
        />
        <ProStat
          icon={
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
          }
          label={p.validity}
          value={
            hasValidPaidExpiry
              ? expiresAt.toLocaleDateString(dateTag, {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "—"
          }
          hint={validityValue}
        />
      </div>

      {/* Cartes des 3 plans */}
      <h2 className="mb-4 mt-10 font-display text-lg font-bold">{p.choosePlan}</h2>
      <div className="grid gap-5 sm:grid-cols-3">
        {PAID_PLAN_TIERS.map((tier, idx) => {
          // +1 : landingPlans[0] est Débutant (gratuit, non affiché ici)
          const card = landingPlans[idx + 1];
          if (!card) return null;
          const isCurrent = tier === activeTier;
          const buttonLabel = isCurrent ? p.renewButton : card.cta;

          return (
            <div
              key={tier}
              className={`relative flex flex-col rounded-2xl border p-6 transition-shadow duration-200 ${
                card.highlight
                  ? "border-[var(--color-brand-500)] bg-[var(--color-brand-500)]"
                  : "border-[var(--border)] bg-[var(--background)]"
              }`}
            >
              {(isCurrent || card.badge) && (
                <span
                  className={`absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3.5 py-1 text-xs font-semibold ${
                    card.highlight
                      ? "bg-white text-[var(--color-brand-600)]"
                      : "bg-[var(--color-brand-500)] text-white"
                  }`}
                >
                  {isCurrent ? p.activeBadge : card.badge}
                </span>
              )}

              <p className={`font-display text-lg font-bold ${card.highlight ? "text-white" : ""}`}>
                {card.name}
              </p>

              <div
                className={`mt-4 inline-flex w-fit items-center gap-2 rounded-xl px-3 py-2 ${
                  card.highlight ? "bg-white/20" : "bg-[var(--color-brand-50)]"
                }`}
              >
                <span
                  className={`font-display text-2xl font-bold ${
                    card.highlight ? "text-white" : "text-[var(--color-brand-600)]"
                  }`}
                >
                  {card.commission}
                </span>
                <span
                  className={`text-sm ${
                    card.highlight ? "text-white/75" : "text-[var(--color-brand-500)]"
                  }`}
                >
                  commission
                </span>
              </div>

              <div className="mt-5">
                <span
                  className={`font-display text-2xl font-bold ${
                    card.highlight ? "text-white" : ""
                  }`}
                >
                  {card.price}
                </span>
                <span
                  className={`ml-1.5 text-sm ${
                    card.highlight ? "text-white/70" : "text-[var(--subtle)]"
                  }`}
                >
                  {card.priceNote}
                </span>
              </div>

              <ul className="mt-5 flex-1 space-y-2.5">
                {card.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <span
                      className={`shrink-0 ${
                        card.highlight ? "text-white/80" : "text-[var(--color-brand-500)]"
                      }`}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <span className={card.highlight ? "text-white/90" : ""}>{f}</span>
                  </li>
                ))}
              </ul>

              <PlanCheckoutButton
                plan={tier}
                highlight={card.highlight}
                label={buttonLabel}
                redirectingLabel={p.redirecting}
                errorLabel={p.paymentError}
              />
            </div>
          );
        })}
      </div>

      {/* Historique des abonnements */}
      <div className="mt-10">
        {history.length === 0 ? (
          <Section title={p.historyTitle}>
            <EmptyState title={p.historyEmpty} body={p.historyEmptyBody} />
          </Section>
        ) : (
          <TableCard title={p.historyTitle}>
            <thead>
              <tr>
                <th>{p.colDate}</th>
                <th>{p.colPlan}</th>
                <th>{p.colPeriod}</th>
                <th>{p.colStatus}</th>
                <th className="text-right">{p.colAmount}</th>
              </tr>
            </thead>
            <tbody>
              {history.map((sub) => {
                const subTier = normalizePlan(sub.plan);
                const periodText =
                  sub.period_start && sub.period_end
                    ? `${new Date(sub.period_start).toLocaleDateString(dateTag, {
                        day: "2-digit",
                        month: "short",
                      })} → ${new Date(sub.period_end).toLocaleDateString(dateTag, {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}`
                    : "—";

                // Une souscription « active » dont la période est passée est expirée.
                const shownStatus =
                  sub.status === "active" && sub.period_end && new Date(sub.period_end) <= now ? "expired" : sub.status;

                return (
                  <tr key={sub.id}>
                    <td className="text-[var(--subtle)]">
                      {new Date(sub.created_at).toLocaleDateString(dateTag, {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="font-semibold">{planDisplayNames[subTier]}</td>
                    <td className="text-[var(--subtle)]">{periodText}</td>
                    <td>
                      <Pill tone={subscriptionTone(shownStatus)}>
                        {p.subStatus[shownStatus] ?? shownStatus}
                      </Pill>
                    </td>
                    <td className="text-right font-display font-bold">
                      {formatMoney(BigInt(sub.amount_minor), sub.currency, locale)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableCard>
        )}
      </div>
    </DashboardShell>
  );
}

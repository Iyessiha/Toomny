import Link from "next/link";
import { getLanding } from "@/content/landing";
import { formatMoney } from "@/lib/money";
import { PLANS, type PlanTier } from "@/lib/plans";
import type { PlanNudge } from "@/lib/plan-nudge";
import type { Locale } from "@/i18n/dictionaries";

const PLAN_INDEX: Record<PlanTier, number> = { debutant: 0, essentiel: 1, pro: 2, expert: 3 };

const copy = {
  fr: {
    freeTitle: "Votre plan actuel : Débutant",
    freeBody: "Vous publiez 2 prestations au taux de commission de 10 %. Passez à un plan payant pour publier davantage, payer moins de commission et utiliser l'assistant IA.",
    expiredTitle: "Votre abonnement a expiré",
    expiredBody: "Vos prestations restent en place, mais votre plan est revenu au Débutant. Renouvelez pour retrouver votre quota et votre commission.",
    limitTitle: "Vous avez atteint votre limite de prestations",
    nearTitle: "Vous approchez de votre limite de prestations",
    limitBody: (used: number, max: number) => `${used} sur ${max} prestations utilisées. Passez au palier supérieur pour continuer à publier.`,
    activeTitle: (tier: string) => `Plan ${tier}`,
    activeBody: (used: number, max: number, pct: number) => `${used} sur ${max} prestations utilisées · commission de ${pct} %`,
    cta: (tier: string) => `Passer à ${tier}`,
    renew: "Renouveler",
    manage: "Gérer mon abonnement",
    price: (p: string) => `${p} / mois`,
  },
  en: {
    freeTitle: "Your current plan: Starter",
    freeBody: "You publish 2 services at a 10% commission. Move to a paid plan to publish more, pay less commission and use the AI assistant.",
    expiredTitle: "Your subscription has expired",
    expiredBody: "Your services stay in place, but your plan went back to Starter. Renew to get your quota and commission back.",
    limitTitle: "You have reached your service limit",
    nearTitle: "You are close to your service limit",
    limitBody: (used: number, max: number) => `${used} of ${max} services used. Upgrade to keep publishing.`,
    activeTitle: (tier: string) => `${tier} plan`,
    activeBody: (used: number, max: number, pct: number) => `${used} of ${max} services used · ${pct}% commission`,
    cta: (tier: string) => `Upgrade to ${tier}`,
    renew: "Renew",
    manage: "Manage my subscription",
    price: (p: string) => `${p} / month`,
  },
} as const;

function planName(tier: PlanTier, locale: Locale): string {
  return getLanding(locale).pricing.plans[PLAN_INDEX[tier]]?.name ?? tier;
}

/** Bandeau d'abonnement : vert quand tout va bien, ambre près de la limite, rouge au plafond ou après expiration. */
export function PlanNudgeCard({ nudge, locale }: { nudge: PlanNudge; locale: Locale }) {
  const t = copy[locale];
  const pct = PLANS[nudge.activeTier].commissionPercent;
  const used = nudge.activeServices;
  const max = nudge.maxServices;
  const next = nudge.nextTier;
  const nextName = next ? planName(next, locale) : null;
  const nextPrice = next ? formatMoney(PLANS[next].priceMinor, "XOF", locale) : null;

  const urgent = nudge.atLimit || nudge.expired;
  const tone = urgent
    ? "border-rose-200 bg-gradient-to-r from-rose-50 to-orange-50 text-rose-900"
    : nudge.nearLimit || nudge.activeTier === "debutant"
      ? "border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-900"
      : "border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-900";

  let title: string;
  let body: string;
  if (nudge.expired) {
    title = t.expiredTitle;
    body = t.expiredBody;
  } else if (nudge.atLimit) {
    title = t.limitTitle;
    body = t.limitBody(used, max);
  } else if (nudge.nearLimit) {
    title = t.nearTitle;
    body = t.limitBody(used, max);
  } else if (nudge.activeTier === "debutant") {
    title = t.freeTitle;
    body = t.freeBody;
  } else {
    title = t.activeTitle(planName(nudge.activeTier, locale));
    body = t.activeBody(used, max, pct);
  }

  const ctaHref = "/dashboard/plan";
  const ctaLabel = nudge.expired
    ? t.renew
    : next && nextName
      ? t.cta(nextName)
      : t.manage;

  return (
    <div className={`mb-6 flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between ${tone}`}>
      <div className="min-w-0">
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5 text-sm opacity-80">{body}</p>
        {next && nextName && nextPrice && (
          <p className="mt-1 text-xs opacity-70">
            {nextName} : {t.price(nextPrice)} · {PLANS[next].commissionPercent} % · {PLANS[next].maxServices} prestations
          </p>
        )}
      </div>
      <Link
        href={ctaHref}
        className="shrink-0 rounded-xl bg-[var(--color-brand-500)] px-5 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:opacity-90 active:scale-95"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}


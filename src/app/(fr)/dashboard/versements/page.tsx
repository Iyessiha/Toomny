import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAuth, isProvider } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell, EmptyState, StatCard } from "@/components/dashboard/shell";
import { PayoutForm } from "@/components/dashboard/payout-form";
import { PayoutRequestButton } from "@/components/dashboard/payout-request-button";
import { formatMoney } from "@/lib/money";
import { getPayoutTexts } from "@/i18n/payouts";
import { getDashboardTexts } from "@/i18n/dashboard";
import { statusTone } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const user = await requireAuth();
  return { title: getPayoutTexts(user.preferredLocale).title };
}

export default async function VersementsPage() {
  const user = await requireAuth();
  if (!isProvider(user.role)) redirect("/dashboard");
  const locale = user.preferredLocale;
  const t = getPayoutTexts(locale);
  const nav = getDashboardTexts(locale).nav;
  const supabase = await createClient();

  const [{ data: profile }, { data: orders }, { data: payoutsData }] = await Promise.all([
    supabase
      .from("provider_profiles")
      .select("payout_channel, payout_msisdn, payout_verified_at")
      .eq("profile_id", user.id)
      .maybeSingle(),
    supabase
      .from("orders")
      .select("id, reference, status, currency, provider_net_minor, updated_at")
      .eq("provider_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(100),
    supabase
      .from("payouts")
      .select("id, order_id, amount_minor, currency, status, channel, created_at, paid_at")
      .eq("provider_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const orderList = orders ?? [];
  const payoutList = payoutsData ?? [];
  const currency = orderList[0]?.currency ?? payoutList[0]?.currency ?? "XOF";

  // Calcul des soldes
  let earned = 0n;
  let inProgress = 0n;
  for (const o of orderList) {
    if (o.status === "completed") earned += BigInt(o.provider_net_minor);
    else if (["funded", "in_progress", "delivered", "disputed"].includes(o.status))
      inProgress += BigInt(o.provider_net_minor);
  }

  // Déjà versé (queued + processing + paid)
  let alreadyQueued = 0n;
  const queuedOrderIds = new Set<string>();
  for (const p of payoutList) {
    if (p.status !== "failed") {
      alreadyQueued += BigInt(p.amount_minor);
      queuedOrderIds.add(p.order_id);
    }
  }
  const available = earned - alreadyQueued < 0n ? 0n : earned - alreadyQueued;

  const hasChannel = !!profile?.payout_channel && !!profile?.payout_msisdn;

  function payoutStatusClass(status: string) {
    if (status === "paid") return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400";
    if (status === "processing") return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400";
    if (status === "failed") return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400";
    return "bg-[var(--surface)] text-[var(--subtle)]";
  }

  return (
    <DashboardShell
      user={user}
      locale={locale}
      title={t.title}
      subtitle={t.subtitle}
      nav={[
        { href: "/dashboard", label: nav.overview },
        { href: "/dashboard/prestations", label: nav.services },
        { href: "/dashboard/profil", label: nav.profile },
        { href: "/dashboard/versements", label: nav.payouts, current: true },
        { href: "/orders", label: nav.orders },
      ]}
    >
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t.earned} value={formatMoney(earned, currency, locale)} hint={t.earnedHint} accent />
        <StatCard label={t.pending} value={formatMoney(inProgress, currency, locale)} hint={t.pendingHint} />
        <StatCard label={t.available} value={formatMoney(available, currency, locale)} hint={t.availableHint} />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[360px_1fr]">
        {/* Left: canal + request button */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6">
            <h2 className="font-display text-base font-bold">{t.channel}</h2>
            <p className="mt-1 text-xs text-[var(--subtle)]">
              {profile?.payout_verified_at ? t.verified : t.notVerified}
            </p>
            <div className="mt-5">
              <PayoutForm locale={locale} channel={profile?.payout_channel ?? null} msisdn={profile?.payout_msisdn ?? null} />
            </div>
          </section>

          <PayoutRequestButton
            locale={locale}
            available={available.toString()}
            currency={currency}
            hasChannel={hasChannel}
          />
        </div>

        {/* Right: payout history + orders */}
        <div className="space-y-8">
          {/* Payout history */}
          <section>
            <h2 className="font-display text-base font-bold">{t.historyPayouts}</h2>
            {payoutList.length === 0 ? (
              <div className="mt-4">
                <EmptyState title={t.emptyPayouts} body={t.emptyPayoutsBody} />
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]">
                {payoutList.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm">
                    <div>
                      <p className="font-medium">{formatMoney(BigInt(p.amount_minor), p.currency, locale)}</p>
                      <p className="text-xs text-[var(--subtle)]">
                        {new Date(p.created_at).toLocaleDateString(
                          locale === "en" ? "en-GB" : "fr-FR",
                          { day: "2-digit", month: "short", year: "numeric" }
                        )}
                        {" · "}{t.channels[p.channel] ?? p.channel}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${payoutStatusClass(p.status)}`}>
                      {t.payoutStatus[p.status] ?? p.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Orders history */}
          <section>
            <h2 className="font-display text-base font-bold">{t.historyOrders}</h2>
            {orderList.length === 0 ? (
              <div className="mt-4"><EmptyState title={t.empty} body={t.emptyBody} /></div>
            ) : (
              <ul className="mt-4 divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]">
                {orderList.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm">
                    <div>
                      <p className="font-medium">{o.reference}</p>
                      <p className="text-xs text-[var(--subtle)]">{t.status[o.status] ?? o.status}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold">{formatMoney(BigInt(o.provider_net_minor), o.currency, locale)}</p>
                      {o.status === "completed" && queuedOrderIds.has(o.id) && (
                        <p className="text-[11px] text-[var(--subtle)]">{t.payoutStatus.queued}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}

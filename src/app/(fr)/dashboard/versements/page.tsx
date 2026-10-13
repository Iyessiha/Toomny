import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth, isProvider } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell, EmptyState } from "@/components/dashboard/shell";
import { dashboardNavSections } from "@/lib/dashboard-nav";
import { Pill, ProStat, Section, TableCard, payoutTone } from "@/components/dashboard/pro";
import { PayoutForm } from "@/components/dashboard/payout-form";
import { PayoutRequestButton } from "@/components/dashboard/payout-request-button";
import { formatMoney } from "@/lib/money";
import { getPayoutTexts } from "@/i18n/payouts";
import { getDashboardTexts } from "@/i18n/dashboard";
import { AutoRefresh } from "@/components/dashboard/auto-refresh";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const user = await requireAuth();
  return { title: getPayoutTexts(user.preferredLocale).title };
}

/** Icône de tuile, reprise du vocabulaire des statistiques du tableau de bord. */
function TileIcon({ tone }: { tone: "brand" | "gold" | "plain" }) {
  const cls = "h-5 w-5";
  if (tone === "gold")
    return (
      <svg aria-hidden className={cls} viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11.9V15a1 1 0 11-2 0v-1.1a4.5 4.5 0 01-2.4-1.3 1 1 0 011.5-1.3c.4.5 1.2.9 2 .9 1 0 1.7-.4 1.7-1 0-.5-.5-.8-1.6-1.1-1.4-.3-3-.9-3-2.7 0-1.3 1-2.3 2.4-2.6V4a1 1 0 112 0v1c.8.2 1.5.6 2 1.2a1 1 0 11-1.5 1.3 2 2 0 00-1.6-.7c-.9 0-1.5.4-1.5.9 0 .4.5.6 1.6.9 1.5.4 3 .9 3 2.8 0 1.4-1 2.4-2.6 2.6z" />
      </svg>
    );
  if (tone === "brand")
    return (
      <svg aria-hidden className={cls} viewBox="0 0 20 20" fill="currentColor">
        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
        <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
      </svg>
    );
  return (
    <svg aria-hidden className={cls} viewBox="0 0 20 20" fill="currentColor">
      <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
      <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
    </svg>
  );
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

  return (
    <DashboardShell
      user={user}
      locale={locale}
      kicker={nav.payouts}
      title={t.title}
      subtitle={t.subtitle}
      navSections={dashboardNavSections(nav, user.role, "/dashboard/versements")}
    >
      <AutoRefresh />
      <div className="grid gap-4 sm:grid-cols-3">
        <ProStat
          tone="brand"
          icon={<TileIcon tone="brand" />}
          label={t.earned}
          value={formatMoney(earned, currency, locale)}
          hint={t.earnedHint}
        />
        <ProStat
          icon={<TileIcon tone="plain" />}
          label={t.pending}
          value={formatMoney(inProgress, currency, locale)}
          hint={t.pendingHint}
        />
        <ProStat
          tone="gold"
          icon={<TileIcon tone="gold" />}
          label={t.available}
          value={formatMoney(available, currency, locale)}
          hint={t.availableHint}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* Colonne gauche : canal de versement + demande */}
        <div className="space-y-6">
          <Section
            title={t.channel}
            subtitle={profile?.payout_verified_at ? t.verified : t.notVerified}
          >
            <PayoutForm
              locale={locale}
              channel={profile?.payout_channel ?? null}
              msisdn={profile?.payout_msisdn ?? null}
            />
          </Section>

          <PayoutRequestButton
            locale={locale}
            available={available.toString()}
            currency={currency}
            hasChannel={hasChannel}
          />
        </div>

        {/* Colonne droite : historique des versements + commandes */}
        <div className="space-y-6">
          {payoutList.length === 0 ? (
            <Section title={t.historyPayouts}>
              <EmptyState title={t.emptyPayouts} body={t.emptyPayoutsBody} />
            </Section>
          ) : (
            <TableCard title={t.historyPayouts}>
              <thead>
                <tr>
                  <th>{t.colDate}</th>
                  <th>{t.colChannel}</th>
                  <th>{t.colStatus}</th>
                  <th className="text-right">{t.colAmount}</th>
                </tr>
              </thead>
              <tbody>
                {payoutList.map((p) => (
                  <tr key={p.id}>
                    <td className="text-[var(--subtle)]">
                      {new Date(p.created_at).toLocaleDateString(
                        locale === "en" ? "en-GB" : "fr-FR",
                        { day: "2-digit", month: "short", year: "numeric" },
                      )}
                    </td>
                    <td>{t.channels[p.channel] ?? p.channel}</td>
                    <td>
                      <Pill tone={payoutTone(p.status)}>
                        {t.payoutStatus[p.status] ?? p.status}
                      </Pill>
                    </td>
                    <td className="text-right font-display font-bold">
                      {formatMoney(BigInt(p.amount_minor), p.currency, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableCard>
          )}

          {orderList.length === 0 ? (
            <Section title={t.historyOrders}>
              <EmptyState title={t.empty} body={t.emptyBody} />
            </Section>
          ) : (
            <TableCard title={t.historyOrders}>
              <thead>
                <tr>
                  <th>{t.colOrder}</th>
                  <th>{t.colStatus}</th>
                  <th className="text-right">{t.colAmount}</th>
                </tr>
              </thead>
              <tbody>
                {orderList.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link
                        href={`/orders/${o.id}`}
                        className="font-semibold text-[var(--color-brand-600)] underline-offset-2 hover:underline"
                      >
                        {o.reference}
                      </Link>
                    </td>
                    <td className="text-[var(--subtle)]">
                      {t.status[o.status] ?? o.status}
                      {o.status === "completed" && queuedOrderIds.has(o.id) && (
                        <span className="ml-2 text-xs">{t.payoutStatus.queued}</span>
                      )}
                    </td>
                    <td className="text-right font-display font-bold">
                      {formatMoney(BigInt(o.provider_net_minor), o.currency, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableCard>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

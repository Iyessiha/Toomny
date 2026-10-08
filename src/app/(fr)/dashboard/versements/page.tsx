import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAuth, isProvider } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell, EmptyState, StatCard } from "@/components/dashboard/shell";
import { PayoutForm } from "@/components/dashboard/payout-form";
import { formatMoney } from "@/lib/money";
import { getPayoutTexts } from "@/i18n/payouts";
import { getDashboardTexts } from "@/i18n/dashboard";

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

  const [{ data: profile }, { data: orders }] = await Promise.all([
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
  ]);

  const list = orders ?? [];
  let earned = 0n;
  let pending = 0n;
  for (const o of list) {
    if (o.status === "completed") earned += BigInt(o.provider_net_minor);
    else if (["funded", "in_progress", "delivered", "disputed"].includes(o.status)) pending += BigInt(o.provider_net_minor);
  }
  const currency = list[0]?.currency ?? "XOF";

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
      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{t.notice}</div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label={t.earned} value={formatMoney(earned, currency, locale)} hint={t.earnedHint} accent />
        <StatCard label={t.pending} value={formatMoney(pending, currency, locale)} hint={t.pendingHint} />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[360px_1fr]">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6">
          <h2 className="font-display text-base font-bold">{t.channel}</h2>
          <p className="mt-1 text-xs text-[var(--subtle)]">
            {profile?.payout_verified_at ? t.verified : t.notVerified}
          </p>
          <div className="mt-5">
            <PayoutForm locale={locale} channel={profile?.payout_channel ?? null} msisdn={profile?.payout_msisdn ?? null} />
          </div>
        </section>

        <section>
          <h2 className="font-display text-base font-bold">{t.history}</h2>
          {list.length === 0 ? (
            <div className="mt-4"><EmptyState title={t.empty} body={t.emptyBody} /></div>
          ) : (
            <ul className="mt-4 divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]">
              {list.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm">
                  <div>
                    <p className="font-medium">{o.reference}</p>
                    <p className="text-xs text-[var(--subtle)]">{t.status[o.status] ?? o.status}</p>
                  </div>
                  <p className="font-display font-bold">{formatMoney(BigInt(o.provider_net_minor), o.currency, locale)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

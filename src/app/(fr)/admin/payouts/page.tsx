import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { EmptyState } from "@/components/dashboard/shell";
import { PayoutRowActions } from "@/components/admin/payout-row-actions";
import { formatMoney } from "@/lib/money";
import { getAdminTexts } from "@/i18n/admin";
import { getPayoutTexts } from "@/i18n/payouts";
import { getMarketplaceTexts } from "@/i18n/marketplace";
import { visitorLocale } from "@/i18n/server-locale";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getAdminTexts(await visitorLocale()).payoutsPage.metaTitle };
}
export const dynamic = "force-dynamic";

const ACTIVE_STATUSES = ["queued", "processing", "failed"] as const;
const ALL_STATUSES = ["queued", "processing", "paid", "failed"] as const;
type StatusFilter = (typeof ALL_STATUSES)[number] | "all" | "active";

function payoutTone(status: string): string {
  if (status === "paid") return "bg-[var(--color-brand-50)] text-[var(--color-brand-700)]";
  if (status === "failed") return "bg-red-50 text-red-700";
  if (status === "processing") return "bg-blue-50 text-blue-700";
  return "bg-amber-50 text-amber-700";
}

export default async function AdminPayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireAdmin();
  const locale = user.preferredLocale;
  const t = getAdminTexts(locale).payoutsPage;
  const nav = getAdminTexts(locale).nav;
  const pt = getPayoutTexts(locale);
  const { status: statusParam } = await searchParams;

  const activeFilter: StatusFilter =
    statusParam === "all" || (ALL_STATUSES as readonly string[]).includes(statusParam ?? "")
      ? (statusParam as StatusFilter)
      : "active";

  const db = createAdminClient();

  let query = db
    .from("payouts")
    .select(
      "id, order_id, provider_id, channel, msisdn, amount_minor, currency, status, provider_ref, attempts, failure_reason, paid_at, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (activeFilter === "active") {
    query = query.in("status", [...ACTIVE_STATUSES]);
  } else if (activeFilter !== "all") {
    query = query.eq("status", activeFilter);
  }

  // Totaux par statut, toutes devises confondues. Volume faible au lancement
  // (une ligne par commande payée) : une requête bornée suffit, sans rpc.
  const [{ data: rows }, { data: totalRows }] = await Promise.all([
    query,
    db.from("payouts").select("status, amount_minor, currency").limit(2000),
  ]);
  const list = rows ?? [];

  const totals = new Map<string, Map<string, { count: number; total: bigint }>>();
  for (const r of totalRows ?? []) {
    const byCurrency = totals.get(r.status) ?? new Map<string, { count: number; total: bigint }>();
    const slot = byCurrency.get(r.currency) ?? { count: 0, total: 0n };
    slot.count += 1;
    slot.total += BigInt(r.amount_minor);
    byCurrency.set(r.currency, slot);
    totals.set(r.status, byCurrency);
  }

  const orderIds = [...new Set(list.map((p) => p.order_id))];
  const providerIds = [...new Set(list.map((p) => p.provider_id))];
  const [{ data: orderRows }, { data: providerRows }] = await Promise.all([
    orderIds.length
      ? db.from("orders").select("id, reference").in("id", orderIds)
      : Promise.resolve({ data: [] }),
    providerIds.length
      ? db.from("profiles").select("id, display_name, email").in("id", providerIds)
      : Promise.resolve({ data: [] }),
  ]);
  const orderRef = new Map((orderRows ?? []).map((o) => [o.id as string, o.reference as string]));
  const providerName = new Map(
    (providerRows ?? []).map((p) => [p.id as string, ((p.display_name ?? p.email ?? "—") as string)]),
  );

  const filters: { key: StatusFilter; label: string }[] = [
    { key: "active", label: t.filterActive },
    { key: "all", label: t.filterAll },
    { key: "queued", label: t.filterQueued },
    { key: "processing", label: t.filterProcessing },
    { key: "paid", label: t.filterPaid },
    { key: "failed", label: t.filterFailed },
  ];

  function filterHref(key: string) {
    return key === "active" ? "/admin/payouts" : `/admin/payouts?status=${key}`;
  }

  const summaryCards = [
    { key: "queued", label: t.totalQueued },
    { key: "processing", label: t.totalProcessing },
    { key: "paid", label: t.totalPaid },
    { key: "failed", label: t.totalFailed },
  ];

  return (
    <AdminShell
      user={user}
      locale={locale}
      title={t.title}
      subtitle={t.subtitle}
      nav={[
        { href: "/admin", label: nav.overview },
        { href: "/admin/verifications", label: nav.kyc },
        { href: "/admin/services", label: nav.services },
        { href: "/admin/categories", label: nav.categories },
        { href: "/admin/users", label: nav.users },
        { href: "/admin/orders", label: nav.orders },
        { href: "/admin/payouts", label: nav.payouts, current: true },
        { href: "/admin/disputes", label: getMarketplaceTexts(locale).nav.disputes },
        { href: "/dashboard", label: nav.myDashboard },
      ]}
    >
      {/* Totaux par statut */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summaryCards.map(({ key, label }) => {
          const byCurrency = totals.get(key);
          const parts = byCurrency
            ? [...byCurrency.entries()].map(
                ([currency, s]) => `${s.count} · ${formatMoney(s.total, currency, locale)}`,
              )
            : ["0"];
          return (
            <div
              key={key}
              className="rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3"
            >
              <p className="text-xs text-[var(--subtle)]">{label}</p>
              <p className="mt-1 font-display text-base font-bold">{parts.join(" — ")}</p>
            </div>
          );
        })}
      </div>

      {/* Onglets de filtre */}
      <div className="mb-5 flex flex-wrap gap-2">
        {filters.map(({ key, label }) => {
          const active = activeFilter === key;
          return (
            <Link
              key={key}
              href={filterHref(key)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? "bg-[var(--color-brand-500)] text-white"
                  : "border border-[var(--border)] text-[var(--subtle)] hover:border-[var(--color-brand-400)] hover:text-[var(--foreground)]"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {list.length === 0 ? (
        <EmptyState title={t.emptyTitle} body={t.emptyBody} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--background)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--subtle)]">
              <tr>
                <th className="px-5 py-3 font-medium">{t.colOrder}</th>
                <th className="px-5 py-3 font-medium">{t.colProvider}</th>
                <th className="px-5 py-3 font-medium">{t.colChannel}</th>
                <th className="px-5 py-3 text-right font-medium">{t.colAmount}</th>
                <th className="px-5 py-3 font-medium">{t.colStatus}</th>
                <th className="px-5 py-3 font-medium">{t.colDate}</th>
                <th className="px-5 py-3 text-right font-medium">{t.colAction}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p, i) => (
                <tr key={p.id} className={i < list.length - 1 ? "border-b border-[var(--border)]" : ""}>
                  <td className="px-5 py-4">
                    <Link
                      href={`/orders/${p.order_id}`}
                      className="font-medium text-[var(--color-brand-600)] underline-offset-2 hover:underline"
                    >
                      {orderRef.get(p.order_id) ?? p.order_id.slice(0, 8)}
                    </Link>
                    <div className="mt-0.5 flex items-center gap-2">
                      <Link
                        href={`/orders/${p.order_id}`}
                        className="rounded-lg border border-[var(--border)] px-2 py-0.5 text-[11px] font-medium transition-colors hover:border-[var(--color-brand-400)]"
                      >
                        {t.viewOrder}
                      </Link>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium">{providerName.get(p.provider_id) ?? "—"}</p>
                    <p className="font-mono text-xs text-[var(--subtle)]">{p.msisdn}</p>
                  </td>
                  <td className="px-5 py-4 text-[var(--subtle)]">
                    {pt.channels[p.channel] ?? p.channel}
                  </td>
                  <td className="px-5 py-4 text-right font-display font-bold">
                    {formatMoney(BigInt(p.amount_minor), p.currency, locale)}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${payoutTone(p.status)}`}>
                      {pt.payoutStatus[p.status] ?? p.status}
                    </span>
                    {(p.attempts ?? 0) > 0 && (
                      <p className="mt-1 text-[11px] text-[var(--subtle)]">
                        {p.attempts} {p.attempts > 1 ? t.attemptsPlural : t.attempts}
                      </p>
                    )}
                    {p.provider_ref && (
                      <p className="mt-0.5 font-mono text-[11px] text-[var(--subtle)]">{p.provider_ref}</p>
                    )}
                    {p.failure_reason && (
                      <p className="mt-0.5 max-w-48 text-[11px] text-red-600">{p.failure_reason}</p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-[var(--subtle)]">
                    {new Date(p.created_at).toLocaleDateString(
                      locale === "en" ? "en-GB" : "fr-FR",
                      { day: "2-digit", month: "short", year: "numeric" },
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <PayoutRowActions payoutId={p.id} status={p.status} locale={locale} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminNavGroups } from "@/lib/admin-nav";
import { EmptyState } from "@/components/dashboard/shell";
import { PayoutRowActions } from "@/components/admin/payout-row-actions";
import { FilterTabs, MiniStat, Pill, TableCard, payoutTone } from "@/components/dashboard/pro";
import { formatMoney } from "@/lib/money";
import { getAdminTexts } from "@/i18n/admin";
import { getPayoutTexts } from "@/i18n/payouts";
import { visitorLocale } from "@/i18n/server-locale";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getAdminTexts(await visitorLocale()).payoutsPage.metaTitle };
}
export const dynamic = "force-dynamic";

const ACTIVE_STATUSES = ["queued", "processing", "failed"] as const;
const ALL_STATUSES = ["queued", "processing", "paid", "failed"] as const;
type StatusFilter = (typeof ALL_STATUSES)[number] | "all" | "active";

export default async function AdminPayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireAdmin();
  const locale = user.preferredLocale;
  const t = getAdminTexts(locale).payoutsPage;
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
      kicker="Administration"
      title={t.title}
      subtitle={t.subtitle}
      nav={getAdminNavGroups(locale, "/admin/payouts")}
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
          return <MiniStat key={key} label={label} value={parts.join(" — ")} />;
        })}
      </div>

      <FilterTabs
        items={filters.map(({ key, label }) => ({
          href: filterHref(key),
          label,
          current: activeFilter === key,
        }))}
      />

      {list.length === 0 ? (
        <EmptyState title={t.emptyTitle} body={t.emptyBody} />
      ) : (
        <TableCard>
          <thead>
            <tr>
              <th>{t.colOrder}</th>
              <th>{t.colProvider}</th>
              <th>{t.colChannel}</th>
              <th className="text-right">{t.colAmount}</th>
              <th>{t.colStatus}</th>
              <th>{t.colDate}</th>
              <th className="text-right">{t.colAction}</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link
                    href={`/orders/${p.order_id}`}
                    className="font-semibold text-[var(--color-brand-600)] underline-offset-2 hover:underline"
                  >
                    {orderRef.get(p.order_id) ?? p.order_id.slice(0, 8)}
                  </Link>
                  <div className="mt-1">
                    <Link href={`/orders/${p.order_id}`} className="btn-ghost btn-sm">
                      {t.viewOrder}
                    </Link>
                  </div>
                </td>
                <td>
                  <p className="font-semibold">{providerName.get(p.provider_id) ?? "—"}</p>
                  <p className="font-mono text-xs text-[var(--subtle)]">{p.msisdn}</p>
                </td>
                <td className="text-[var(--subtle)]">{pt.channels[p.channel] ?? p.channel}</td>
                <td className="text-right font-display font-bold">
                  {formatMoney(BigInt(p.amount_minor), p.currency, locale)}
                </td>
                <td>
                  <Pill tone={payoutTone(p.status)}>
                    {pt.payoutStatus[p.status] ?? p.status}
                  </Pill>
                  {(p.attempts ?? 0) > 0 && (
                    <p className="mt-1 text-[11px] text-[var(--subtle)]">
                      {p.attempts} {p.attempts > 1 ? t.attemptsPlural : t.attempts}
                    </p>
                  )}
                  {p.provider_ref && (
                    <p className="mt-0.5 font-mono text-[11px] text-[var(--subtle)]">{p.provider_ref}</p>
                  )}
                  {p.failure_reason && (
                    <p className="mt-0.5 max-w-48 text-[11px] text-[var(--tone-danger-fg)]">
                      {p.failure_reason}
                    </p>
                  )}
                </td>
                <td className="text-[var(--subtle)]">
                  {new Date(p.created_at).toLocaleDateString(
                    locale === "en" ? "en-GB" : "fr-FR",
                    { day: "2-digit", month: "short", year: "numeric" },
                  )}
                </td>
                <td>
                  <PayoutRowActions payoutId={p.id} status={p.status} locale={locale} />
                </td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      )}
    </AdminShell>
  );
}

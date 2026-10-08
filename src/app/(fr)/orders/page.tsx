import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell, EmptyState } from "@/components/dashboard/shell";
import { statusTone } from "@/lib/dashboard";
import { getDashboardTexts } from "@/i18n/dashboard";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = { title: "Mes commandes · Toomny" };
export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await requireAuth();
  const locale = user.preferredLocale;
  const t = getDashboardTexts(locale);
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("id, reference, status, amount_minor, provider_net_minor, currency, client_id, provider_id, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const list = data ?? [];

  return (
    <DashboardShell
      user={user}
      title={t.orders.title}
      locale={locale}
      subtitle={t.orders.subtitle}
      nav={[
        { href: "/dashboard", label: t.nav.overview },
        { href: "/orders", label: t.nav.orders, current: true },
        { href: "/messages", label: t.nav.messages },
      ]}
    >
      {list.length === 0 ? (
        <EmptyState title={t.orders.empty} body={t.orders.emptyBody} action={{ href: "/services", label: t.orders.emptyCta }} />
      ) : (
        <ul className="app-stagger divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]">
          {list.map((o) => {
            const isProvider = o.provider_id === user.id;
            const amount = isProvider ? o.provider_net_minor : o.amount_minor;
            return (
              <li key={o.id}>
                <Link href={`/orders/${o.id}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-[var(--surface)]">
                  <div>
                    <p className="font-medium">{o.reference}</p>
                    <p className="text-xs text-[var(--subtle)]">{isProvider ? t.orders.asProvider : t.orders.asClient}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(o.status)}`}>
                      {t.status[o.status] ?? o.status}
                    </span>
                    <span className="font-display font-bold">{formatMoney(BigInt(amount), o.currency, locale)}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardShell>
  );
}

import type { Metadata } from "next";
import { getPublicPageTexts } from "@/i18n/public-pages";
import { visitorLocale } from "@/i18n/server-locale";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell, EmptyState } from "@/components/dashboard/shell";
import { Pill, TableCard, orderTone } from "@/components/dashboard/pro";
import { getDashboardTexts } from "@/i18n/dashboard";
import { formatMoney } from "@/lib/money";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getPublicPageTexts(await visitorLocale()).titles.orders };
}
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
        { href: "/demandes", label: t.nav.inquiries },
      ]}
    >
      {list.length === 0 ? (
        <EmptyState title={t.orders.empty} body={t.orders.emptyBody} action={{ href: "/services", label: t.orders.emptyCta }} />
      ) : (
        <TableCard>
          <thead>
            <tr>
              <th>{t.orders.colReference}</th>
              <th>{t.orders.colRole}</th>
              <th>{t.orders.colStatus}</th>
              <th className="text-right">{t.orders.colAmount}</th>
            </tr>
          </thead>
          <tbody>
            {list.map((o) => {
              const providerSide = o.provider_id === user.id;
              const amount = providerSide ? o.provider_net_minor : o.amount_minor;
              return (
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
                    {providerSide ? t.orders.asProvider : t.orders.asClient}
                  </td>
                  <td>
                    <Pill tone={orderTone(o.status)}>{t.status[o.status] ?? o.status}</Pill>
                  </td>
                  <td className="text-right font-display font-bold">
                    {formatMoney(BigInt(amount), o.currency, locale)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableCard>
      )}
    </DashboardShell>
  );
}

import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { DashboardShell, EmptyState } from "@/components/dashboard/shell";
import { statusTone } from "@/lib/dashboard";
import { getDashboardTexts } from "@/i18n/dashboard";
import { formatMoney } from "@/lib/money";
import { confirmPaymentReceived } from "./actions";
import { getAdminTexts } from "@/i18n/admin";
import { visitorLocale } from "@/i18n/server-locale";
import { getMarketplaceTexts } from "@/i18n/marketplace";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getAdminTexts(await visitorLocale()).ordersPage.metaTitle };
}
export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const user = await requireAdmin();
  const locale = user.preferredLocale;
  const t = getAdminTexts(locale).ordersPage;
  const nav = getAdminTexts(locale).nav;
  const db = createAdminClient();

  const { data } = await db
    .from("orders")
    .select("id, reference, status, amount_minor, currency, created_at")
    .in("status", ["pending_payment", "funded", "in_progress", "delivered", "disputed"])
    .order("created_at", { ascending: false })
    .limit(100);

  const list = data ?? [];

  return (
    <DashboardShell
      user={user}
      locale={locale}
      title={t.title}
      subtitle={t.subtitle}
      nav={[
        { href: "/admin", label: nav.overview },
        { href: "/admin/verifications", label: nav.kyc },
        { href: "/admin/services", label: nav.services },
        { href: "/admin/orders", label: nav.orders, current: true },
        { href: "/admin/disputes", label: getMarketplaceTexts(locale).nav.disputes },
        { href: "/dashboard", label: nav.myDashboard },
      ]}
    >
      {list.length === 0 ? (
        <EmptyState title={t.emptyTitle} body={t.emptyBody} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--subtle)]">
              <tr>
                <th className="px-5 py-3 font-medium">{getAdminTexts(locale).overview.colReference}</th>
                <th className="px-5 py-3 font-medium">{getAdminTexts(locale).overview.colStatus}</th>
                <th className="px-5 py-3 text-right font-medium">{getAdminTexts(locale).overview.colAmount}</th>
                <th className="px-5 py-3 text-right font-medium">{t.colAction}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((o, i) => (
                <tr key={o.id} className={i < list.length - 1 ? "border-b border-[var(--border)]" : ""}>
                  <td className="px-5 py-4 font-medium">{o.reference}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(o.status)}`}>
                      {getDashboardTexts(locale).status[o.status] ?? o.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right font-display font-bold">{formatMoney(BigInt(o.amount_minor), o.currency, locale)}</td>
                  <td className="px-5 py-4 text-right">
                    {o.status === "pending_payment" && (
                      <form action={confirmPaymentReceived}>
                        <input type="hidden" name="orderId" value={o.id} />
                        <button type="submit" className="rounded-full bg-[var(--color-brand-500)] px-3 py-1.5 text-xs font-semibold text-white">
                          {t.confirm}
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}

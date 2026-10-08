import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { DashboardShell, EmptyState } from "@/components/dashboard/shell";
import { formatMoney } from "@/lib/money";
import { getAdminTexts } from "@/i18n/admin";
import { getMarketplaceTexts } from "@/i18n/marketplace";
import { visitorLocale } from "@/i18n/server-locale";
import { resolveDispute } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getMarketplaceTexts(await visitorLocale()).adminDisputes.metaTitle };
}
export const dynamic = "force-dynamic";

const OPEN = ["open", "awaiting_provider", "awaiting_client"];

export default async function AdminDisputesPage() {
  const user = await requireAdmin();
  const locale = user.preferredLocale;
  const t = getMarketplaceTexts(locale).adminDisputes;
  const nav = getAdminTexts(locale).nav;
  const db = createAdminClient();

  const { data } = await db
    .from("disputes")
    .select("id, reason, status, created_at, order:orders(reference, amount_minor, currency)")
    .in("status", OPEN)
    .order("created_at", { ascending: true })
    .limit(100);
  const rows = (data ?? []).map((d) => ({ ...d, order: Array.isArray(d.order) ? d.order[0] : d.order }));

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
        { href: "/admin/orders", label: nav.orders },
        { href: "/admin/disputes", label: t.title, current: true },
        { href: "/dashboard", label: nav.myDashboard },
      ]}
    >
      {rows.length === 0 ? (
        <EmptyState title={t.empty} body={t.emptyBody} />
      ) : (
        <ul className="space-y-4">
          {rows.map((d) => (
            <li key={d.id} className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-medium">
                  {t.colOrder} {d.order?.reference} ·{" "}
                  {d.order ? formatMoney(BigInt(d.order.amount_minor), d.order.currency, locale) : "—"}
                </p>
                <p className="text-xs text-[var(--subtle)]">{new Date(d.created_at).toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR")}</p>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm">
                <span className="text-[var(--subtle)]">{t.reason} :</span> {d.reason}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <form action={resolveDispute}>
                  <input type="hidden" name="disputeId" value={d.id} />
                  <input type="hidden" name="decision" value="client" />
                  <button type="submit" className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold">{t.refund}</button>
                </form>
                <form action={resolveDispute}>
                  <input type="hidden" name="disputeId" value={d.id} />
                  <input type="hidden" name="decision" value="provider" />
                  <button type="submit" className="rounded-full bg-[var(--color-brand-500)] px-4 py-2 text-xs font-semibold text-white">{t.release}</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardShell>
  );
}

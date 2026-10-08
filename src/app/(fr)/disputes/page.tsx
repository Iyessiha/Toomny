import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell, EmptyState } from "@/components/dashboard/shell";
import { getDashboardTexts } from "@/i18n/dashboard";
import { getMarketplaceTexts } from "@/i18n/marketplace";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const user = await requireAuth();
  return { title: getMarketplaceTexts(user.preferredLocale).disputes.metaTitle };
}

export default async function DisputesPage() {
  const user = await requireAuth();
  const locale = user.preferredLocale;
  const t = getMarketplaceTexts(locale).disputes;
  const nav = getDashboardTexts(locale).nav;
  const supabase = await createClient();

  // RLS : seuls les litiges des commandes de l'utilisateur sont visibles.
  const { data } = await supabase
    .from("disputes")
    .select("id, reason, status, created_at, order:orders(id, reference)")
    .order("created_at", { ascending: false })
    .limit(100);
  const disputes = (data ?? []).map((d) => ({ ...d, order: Array.isArray(d.order) ? d.order[0] : d.order }));

  return (
    <DashboardShell
      user={user}
      locale={locale}
      title={t.title}
      subtitle={t.subtitle}
      nav={[
        { href: "/dashboard", label: nav.overview },
        { href: "/orders", label: nav.orders },
        { href: "/messages", label: nav.messages },
        { href: "/disputes", label: t.title, current: true },
      ]}
    >
      {disputes.length === 0 ? (
        <EmptyState title={t.empty} body={t.emptyBody} />
      ) : (
        <ul className="space-y-4">
          {disputes.map((d) => (
            <li key={d.id} className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Link href={`/orders/${d.order?.id}`} className="font-medium underline underline-offset-4">
                  {t.order} {d.order?.reference}
                </Link>
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                  {t.status[d.status] ?? d.status}
                </span>
              </div>
              <p className="mt-3 text-sm">
                <span className="text-[var(--subtle)]">{t.reason} :</span> {d.reason}
              </p>
            </li>
          ))}
        </ul>
      )}
    </DashboardShell>
  );
}

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
  return { title: getMarketplaceTexts(user.preferredLocale).messages.metaTitle };
}

export default async function MessagesPage() {
  const user = await requireAuth();
  const locale = user.preferredLocale;
  const t = getMarketplaceTexts(locale).messages;
  const nav = getDashboardTexts(locale).nav;
  const supabase = await createClient();

  // RLS : seules les commandes où l'utilisateur est partie prenante sont visibles.
  const { data } = await supabase
    .from("orders")
    .select("id, reference, status, updated_at")
    .order("updated_at", { ascending: false })
    .limit(100);
  const orders = data ?? [];

  return (
    <DashboardShell
      user={user}
      locale={locale}
      title={t.title}
      subtitle={t.subtitle}
      nav={[
        { href: "/dashboard", label: nav.overview },
        { href: "/orders", label: nav.orders },
        { href: "/messages", label: nav.messages, current: true },
        { href: "/disputes", label: getMarketplaceTexts(locale).disputes.title },
      ]}
    >
      {orders.length === 0 ? (
        <EmptyState title={t.empty} body={t.emptyBody} />
      ) : (
        <ul className="divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/orders/${o.id}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-[var(--surface)]">
                <span className="font-medium">{o.reference}</span>
                <span className="text-sm text-[var(--color-brand-600)]">{t.open} →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DashboardShell>
  );
}

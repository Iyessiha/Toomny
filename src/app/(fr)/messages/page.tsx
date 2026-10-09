import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell, EmptyState } from "@/components/dashboard/shell";
import { getDashboardTexts } from "@/i18n/dashboard";
import { getMarketplaceTexts } from "@/i18n/marketplace";
import { statusTone } from "@/lib/dashboard";

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
  const statusLabels = getDashboardTexts(locale).status;
  const supabase = await createClient();

  // Commandes dont l'utilisateur est partie (RLS).
  const { data: orders } = await supabase
    .from("orders")
    .select("id, reference, status, updated_at, service:services(title)")
    .order("updated_at", { ascending: false })
    .limit(60);

  const orderIds = orders?.map((o) => o.id) ?? [];

  // Dernier message + comptage des non-lus par commande.
  let lastMsgMap = new Map<string, { body: string; created_at: string; mine: boolean }>();
  let unreadMap = new Map<string, number>();

  if (orderIds.length > 0) {
    const { data: msgs } = await supabase
      .from("messages")
      .select("id, order_id, body, sender_id, read_at, created_at")
      .in("order_id", orderIds)
      .order("created_at", { ascending: false });

    for (const m of msgs ?? []) {
      if (!lastMsgMap.has(m.order_id)) {
        lastMsgMap.set(m.order_id, {
          body: m.body,
          created_at: m.created_at,
          mine: m.sender_id === user.id,
        });
      }
      if (m.sender_id !== user.id && !m.read_at) {
        unreadMap.set(m.order_id, (unreadMap.get(m.order_id) ?? 0) + 1);
      }
    }
  }

  const conversations = (orders ?? []).map((o) => ({
    ...o,
    service: Array.isArray(o.service) ? o.service[0] : o.service,
    lastMsg: lastMsgMap.get(o.id) ?? null,
    unread: unreadMap.get(o.id) ?? 0,
  }));

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
      {conversations.length === 0 ? (
        <EmptyState title={t.empty} body={t.emptyBody} />
      ) : (
        <ul className="divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link
                href={`/orders/${c.id}`}
                className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-[var(--surface)]"
              >
                {/* Initiale / avatar */}
                <span
                  aria-hidden
                  className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[var(--color-brand-100)] text-sm font-bold text-[var(--color-brand-700)]"
                >
                  {c.reference.slice(-2)}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold">
                      {c.service?.title ?? c.reference}
                    </span>
                    <span className="flex-none text-xs text-[var(--subtle)]">
                      {c.lastMsg
                        ? new Date(c.lastMsg.created_at).toLocaleDateString(
                            locale === "en" ? "en-GB" : "fr-FR",
                            { day: "numeric", month: "short" }
                          )
                        : new Date(c.updated_at).toLocaleDateString(
                            locale === "en" ? "en-GB" : "fr-FR",
                            { day: "numeric", month: "short" }
                          )}
                    </span>
                  </div>

                  <div className="mt-0.5 flex items-center gap-2">
                    <p className="truncate text-xs text-[var(--subtle)]">
                      {c.lastMsg
                        ? `${c.lastMsg.mine ? (locale === "en" ? "You: " : "Vous : ") : ""}${c.lastMsg.body}`
                        : t.noMessage}
                    </p>
                    {c.unread > 0 && (
                      <span className="flex-none rounded-full bg-[var(--color-brand-500)] px-2 py-0.5 text-[10px] font-bold text-white">
                        {c.unread}
                      </span>
                    )}
                  </div>

                  <span
                    className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusTone(c.status)}`}
                  >
                    {statusLabels[c.status] ?? c.status}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DashboardShell>
  );
}

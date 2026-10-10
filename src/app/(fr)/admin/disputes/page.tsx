import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { DashboardShell, EmptyState } from "@/components/dashboard/shell";
import { formatMoney } from "@/lib/money";
import { getAdminTexts } from "@/i18n/admin";
import { getMarketplaceTexts } from "@/i18n/marketplace";
import { visitorLocale } from "@/i18n/server-locale";
import { resolveDispute } from "./actions";
import { DisputeThread } from "@/components/admin/dispute-thread";

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

  // Disputes avec données commande (client_id + provider_id pour labelliser les messages)
  const { data } = await db
    .from("disputes")
    .select(`
      id, reason, status, created_at, order_id,
      order:orders(id, reference, amount_minor, currency, client_id, provider_id)
    `)
    .in("status", OPEN)
    .order("created_at", { ascending: true })
    .limit(100);

  const rows = (data ?? []).map((d) => ({
    ...d,
    order: Array.isArray(d.order) ? d.order[0] : d.order,
  }));

  // Récupérer tous les messages de ces commandes en une seule requête
  const orderIds = rows.map((d) => d.order_id).filter(Boolean);
  const { data: allMessages } = orderIds.length
    ? await db
        .from("messages")
        .select("id, order_id, sender_id, body, created_at")
        .in("order_id", orderIds)
        .order("created_at", { ascending: true })
    : { data: [] };

  // Récupérer les noms des expéditeurs
  const senderIds = [...new Set((allMessages ?? []).map((m) => m.sender_id))];
  const { data: senderProfiles } = senderIds.length
    ? await db
        .from("profiles")
        .select("id, display_name, first_name, last_name, email")
        .in("id", senderIds)
    : { data: [] };

  const profileMap = new Map(
    (senderProfiles ?? []).map((p) => [
      p.id,
      p.display_name ?? ([p.first_name, p.last_name].filter(Boolean).join(" ") || p.email),
    ])
  );

  // Grouper les messages par order_id
  const messagesByOrder = new Map<string, typeof allMessages>();
  for (const m of allMessages ?? []) {
    const list = messagesByOrder.get(m.order_id) ?? [];
    list.push(m);
    messagesByOrder.set(m.order_id, list);
  }

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
        { href: "/admin/categories", label: nav.categories },
        { href: "/admin/users", label: nav.users },
        { href: "/admin/orders", label: nav.orders },
        { href: "/admin/disputes", label: t.title, current: true },
        { href: "/dashboard", label: nav.myDashboard },
      ]}
    >
      {rows.length === 0 ? (
        <EmptyState title={t.empty} body={t.emptyBody} />
      ) : (
        <ul className="space-y-4">
          {rows.map((d) => {
            const ordMessages = (messagesByOrder.get(d.order_id) ?? []).map((m) => {
              let role = t.labelAdmin;
              if (d.order?.client_id === m.sender_id) role = t.labelClient;
              else if (d.order?.provider_id === m.sender_id) role = t.labelProvider;
              return {
                id: m.id,
                body: m.body,
                created_at: m.created_at,
                senderName: profileMap.get(m.sender_id) ?? "—",
                senderRole: role,
              };
            });

            return (
              <li key={d.id} className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <p className="font-medium">
                      {t.colOrder}{" "}
                      <Link
                        href={`/orders/${d.order_id}`}
                        className="text-[var(--color-brand-600)] underline-offset-2 hover:underline"
                      >
                        {d.order?.reference ?? d.order_id.slice(0, 8)}
                      </Link>
                      {d.order && (
                        <span className="ml-1 text-[var(--subtle)]">
                          · {formatMoney(BigInt(d.order.amount_minor), d.order.currency, locale)}
                        </span>
                      )}
                    </p>
                    <Link
                      href={`/orders/${d.order_id}`}
                      className="rounded-lg border border-[var(--border)] px-3 py-1 text-xs font-medium transition-colors hover:border-[var(--color-brand-400)]"
                    >
                      {t.viewOrder}
                    </Link>
                  </div>
                  <p className="text-xs text-[var(--subtle)]">
                    {new Date(d.created_at).toLocaleDateString(
                      locale === "en" ? "en-GB" : "fr-FR",
                      { day: "2-digit", month: "short", year: "numeric" }
                    )}
                  </p>
                </div>

                {/* Reason */}
                <p className="mt-3 whitespace-pre-line text-sm">
                  <span className="text-[var(--subtle)]">{t.reason} :</span> {d.reason}
                </p>

                {/* Messages thread (expandable) */}
                <DisputeThread
                  messages={ordMessages}
                  threadLabel={t.thread}
                  showLabel={t.showThread}
                  hideLabel={t.hideThread}
                  noMessagesLabel={t.noMessages}
                />

                {/* Actions */}
                <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
                  <form action={resolveDispute}>
                    <input type="hidden" name="disputeId" value={d.id} />
                    <input type="hidden" name="decision" value="client" />
                    <button
                      type="submit"
                      className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold transition-colors hover:border-red-400 hover:text-red-600"
                    >
                      {t.refund}
                    </button>
                  </form>
                  <form action={resolveDispute}>
                    <input type="hidden" name="disputeId" value={d.id} />
                    <input type="hidden" name="decision" value="provider" />
                    <button
                      type="submit"
                      className="rounded-full bg-[var(--color-brand-500)] px-4 py-2 text-xs font-semibold text-white"
                    >
                      {t.release}
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardShell>
  );
}

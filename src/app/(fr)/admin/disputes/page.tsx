import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminNavGroups } from "@/lib/admin-nav";
import { EmptyState } from "@/components/dashboard/shell";
import { FilterTabs, Pill, Section, disputeTone } from "@/components/dashboard/pro";
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

const OPEN_STATUSES = ["open", "awaiting_provider", "awaiting_client"];
const RESOLVED_STATUSES = ["resolved_client", "resolved_provider", "resolved_split"];

export default async function AdminDisputesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireAdmin();
  const locale = user.preferredLocale;
  const t = getMarketplaceTexts(locale).adminDisputes;
  const statusLabels = getMarketplaceTexts(locale).disputes.status;
  const db = createAdminClient();
  const { tab } = await searchParams;
  const showResolved = tab === "resolved";
  const activeStatuses = showResolved ? RESOLVED_STATUSES : OPEN_STATUSES;

  // Disputes avec données commande (client_id + provider_id pour labelliser les messages)
  const { data } = await db
    .from("disputes")
    .select(`
      id, reason, status, created_at, order_id,
      order:orders(id, reference, amount_minor, currency, client_id, provider_id)
    `)
    .in("status", activeStatuses)
    .order("created_at", { ascending: showResolved ? false : true })
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

  const openLabel = locale === "en" ? "Open" : "Ouverts";
  const resolvedLabel = locale === "en" ? "Resolved" : "Résolus";

  return (
    <AdminShell
      user={user}
      locale={locale}
      kicker="Administration"
      title={t.title}
      subtitle={t.subtitle}
      nav={getAdminNavGroups(locale, "/admin/disputes")}
    >
      <FilterTabs
        items={[
          { href: "/admin/disputes", label: openLabel, current: !showResolved },
          { href: "/admin/disputes?tab=resolved", label: resolvedLabel, current: showResolved },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyState title={t.empty} body={t.emptyBody} />
      ) : (
        <>
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
                <li key={d.id}>
                  <Section
                    action={<Pill tone={disputeTone(d.status)}>{statusLabels[d.status] ?? d.status}</Pill>}
                    title={`${t.colOrder} ${d.order?.reference ?? d.order_id.slice(0, 8)}`}
                    subtitle={
                      d.order
                        ? `${formatMoney(BigInt(d.order.amount_minor), d.order.currency, locale)} · ${new Date(
                            d.created_at,
                          ).toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}`
                        : new Date(d.created_at).toLocaleDateString(
                            locale === "en" ? "en-GB" : "fr-FR",
                            { day: "2-digit", month: "short", year: "numeric" },
                          )
                    }
                  >
                    <p className="text-sm font-medium text-[var(--subtle)]">{t.reason}</p>
                    <p className="mt-1 whitespace-pre-line text-sm">{d.reason}</p>

                    <div className="mt-4">
                      <DisputeThread
                        messages={ordMessages}
                        threadLabel={t.thread}
                        showLabel={t.showThread}
                        hideLabel={t.hideThread}
                        noMessagesLabel={t.noMessages}
                      />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
                      <Link href={`/orders/${d.order_id}`} className="btn-ghost btn-sm">
                        {t.viewOrder}
                      </Link>
                      {!showResolved && (
                        <>
                          <form action={resolveDispute}>
                            <input type="hidden" name="disputeId" value={d.id} />
                            <input type="hidden" name="decision" value="client" />
                            <button type="submit" className="btn-danger btn-sm">
                              {t.refund}
                            </button>
                          </form>
                          <form action={resolveDispute}>
                            <input type="hidden" name="disputeId" value={d.id} />
                            <input type="hidden" name="decision" value="provider" />
                            <button type="submit" className="btn-success btn-sm">
                              {t.release}
                            </button>
                          </form>
                        </>
                      )}
                    </div>
                  </Section>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </AdminShell>
  );
}

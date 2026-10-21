import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell, EmptyState } from "@/components/dashboard/shell";
import { dashboardNavSections } from "@/lib/dashboard-nav";
import { Avatar, Pill, orderTone } from "@/components/dashboard/pro";
import { getDashboardTexts } from "@/i18n/dashboard";
import { getMarketplaceTexts } from "@/i18n/marketplace";
import { resolveDisplayNames } from "@/lib/names";
import { NotificationBell } from "@/components/dashboard/notification-bell";

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
    .select("id, reference, status, updated_at, client_id, provider_id, service:services(title)")
    .order("updated_at", { ascending: false })
    .limit(60);

  const orderIds = orders?.map((o) => o.id) ?? [];

  // Nom de l'interlocuteur pour chaque commande. Résolution côté serveur :
  // la RLS ne laisse chacun lire que sa propre ligne `profiles`.
  const counterpartIds = [
    ...new Set(
      (orders ?? []).map((o) =>
        o.client_id === user.id ? o.provider_id : o.client_id
      ).filter(Boolean) as string[]
    ),
  ];
  const profileMap = await resolveDisplayNames(counterpartIds);

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

  const conversations = (orders ?? []).map((o) => {
    const counterpartId = o.client_id === user.id ? o.provider_id : o.client_id;
    const counterpart = counterpartId ? profileMap.get(counterpartId) : undefined;
    return {
      ...o,
      service: Array.isArray(o.service) ? o.service[0] : o.service,
      lastMsg: lastMsgMap.get(o.id) ?? null,
      unread: unreadMap.get(o.id) ?? 0,
      counterpartName: counterpart?.name ?? null,
      counterpartInitials: counterpart?.initials ?? o.reference.slice(-2),
    };
  });

  return (
    <DashboardShell
      user={user}
      bell={<NotificationBell locale={locale} />}
      locale={locale}
      title={t.title}
      subtitle={t.subtitle}
      navSections={dashboardNavSections(nav, user.role, "/messages")}
    >
      {conversations.length === 0 ? (
        <EmptyState title={t.empty} body={t.emptyBody} />
      ) : (
        <ul className="card divide-y divide-[var(--border)] overflow-hidden">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link
                href={`/orders/${c.id}`}
                className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-[var(--surface)]"
              >
                {/* Avatar de l'interlocuteur */}
                <span className="mt-0.5">
                  <Avatar name={c.counterpartName ?? c.counterpartInitials} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      {c.counterpartName && (
                        <p className="truncate text-sm font-semibold leading-tight">
                          {c.counterpartName}
                        </p>
                      )}
                      <span className={`truncate text-xs ${c.counterpartName ? "text-[var(--subtle)]" : "text-sm font-semibold"}`}>
                        {c.service?.title ?? c.reference}
                      </span>
                    </div>
                    <span className="flex-none shrink-0 text-xs text-[var(--subtle)]">
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

                  <span className="mt-1.5 inline-block">
                    <Pill tone={orderTone(c.status)}>{statusLabels[c.status] ?? c.status}</Pill>
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

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth, isProvider } from "@/lib/auth";
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

  // Les admins ont leur propre inbox
  if (user.role === "admin") redirect("/admin/messages");

  const locale = user.preferredLocale;
  const t = getMarketplaceTexts(locale).messages;
  const nav = getDashboardTexts(locale).nav;
  const statusLabels = getDashboardTexts(locale).status;
  const supabase = await createClient();

  // ── Commandes avec messages ────────────────────────────────────────────────
  const { data: orders } = await supabase
    .from("orders")
    .select("id, reference, status, updated_at, client_id, provider_id, service:services(title)")
    .order("updated_at", { ascending: false })
    .limit(60);

  const orderIds = orders?.map((o) => o.id) ?? [];

  const counterpartIds = [
    ...new Set(
      (orders ?? [])
        .map((o) => (o.client_id === user.id ? o.provider_id : o.client_id))
        .filter(Boolean) as string[],
    ),
  ];
  const profileMap = await resolveDisplayNames(counterpartIds);

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

  // ── Fils de support (prestataires uniquement) ──────────────────────────────
  const showSupport = isProvider(user.role);
  let supportThreads: Array<{
    id: string;
    subject: string;
    status: string;
    last_message_at: string | null;
    lastBody: string | null;
    unread: number;
  }> = [];

  if (showSupport) {
    const { data: threads } = await supabase
      .from("support_threads")
      .select("id, subject, status, last_message_at")
      .eq("provider_id", user.id)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(20);

    if (threads && threads.length > 0) {
      const threadIds = threads.map((th) => th.id);
      const { data: lastMsgs } = await supabase
        .from("support_messages")
        .select("id, thread_id, body, sender_id, read_at, created_at")
        .in("thread_id", threadIds)
        .order("created_at", { ascending: false });

      const bodyMap = new Map<string, string>();
      const unreadSupportMap = new Map<string, number>();
      for (const m of lastMsgs ?? []) {
        if (!bodyMap.has(m.thread_id)) bodyMap.set(m.thread_id, m.body);
        if (m.sender_id !== user.id && !m.read_at) {
          unreadSupportMap.set(m.thread_id, (unreadSupportMap.get(m.thread_id) ?? 0) + 1);
        }
      }

      supportThreads = threads.map((th) => ({
        ...th,
        lastBody: bodyMap.get(th.id) ?? null,
        unread: unreadSupportMap.get(th.id) ?? 0,
      }));
    }
  }

  const ts = t.support;

  return (
    <DashboardShell
      user={user}
      bell={<NotificationBell locale={locale} />}
      locale={locale}
      title={t.title}
      subtitle={t.subtitle}
      navSections={dashboardNavSections(nav, user.role, "/messages")}
    >
      <div className="space-y-10">
        {/* ── Section support (prestataires) ──────────────────────────────── */}
        {showSupport && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold">{ts.title}</h2>
                <p className="text-sm text-[var(--subtle)]">{ts.subtitle}</p>
              </div>
              <Link
                href="/messages/support/nouveau"
                className="rounded-full bg-[var(--color-brand-500)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-brand-600)]"
              >
                {ts.newThread}
              </Link>
            </div>

            {supportThreads.length === 0 ? (
              <div className="card flex flex-col items-center gap-3 py-10 text-center">
                <p className="font-semibold">{ts.emptyTitle}</p>
                <p className="text-sm text-[var(--subtle)]">{ts.emptyBody}</p>
                <Link
                  href="/messages/support/nouveau"
                  className="mt-2 rounded-full bg-[var(--color-brand-500)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-brand-600)]"
                >
                  {ts.contactUs}
                </Link>
              </div>
            ) : (
              <ul className="card divide-y divide-[var(--border)] overflow-hidden">
                {supportThreads.map((th) => (
                  <li key={th.id}>
                    <Link
                      href={`/messages/${th.id}`}
                      className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-[var(--surface)]"
                    >
                      <span className="mt-0.5">
                        <Avatar name="TM" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold">{th.subject}</p>
                          <span className="flex-none text-xs text-[var(--subtle)]">
                            {th.last_message_at
                              ? new Date(th.last_message_at).toLocaleDateString(
                                  locale === "en" ? "en-GB" : "fr-FR",
                                  { day: "numeric", month: "short" },
                                )
                              : ""}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-2">
                          <p className="truncate text-xs text-[var(--subtle)]">
                            {th.lastBody ?? ts.noMessages}
                          </p>
                          {th.unread > 0 && (
                            <span className="flex-none rounded-full bg-[var(--color-brand-500)] px-2 py-0.5 text-[10px] font-bold text-white">
                              {th.unread}
                            </span>
                          )}
                        </div>
                        {th.status === "closed" && (
                          <span className="mt-1.5 inline-block rounded-full bg-[var(--surface)] px-2 py-0.5 text-[10px] text-[var(--subtle)]">
                            {ts.closed}
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* ── Section commandes ────────────────────────────────────────────── */}
        <section>
          <h2 className="mb-4 font-display text-lg font-bold">{t.title}</h2>
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
                          <span
                            className={`truncate text-xs ${c.counterpartName ? "text-[var(--subtle)]" : "text-sm font-semibold"}`}
                          >
                            {c.service?.title ?? c.reference}
                          </span>
                        </div>
                        <span className="flex-none shrink-0 text-xs text-[var(--subtle)]">
                          {c.lastMsg
                            ? new Date(c.lastMsg.created_at).toLocaleDateString(
                                locale === "en" ? "en-GB" : "fr-FR",
                                { day: "numeric", month: "short" },
                              )
                            : new Date(c.updated_at).toLocaleDateString(
                                locale === "en" ? "en-GB" : "fr-FR",
                                { day: "numeric", month: "short" },
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
                        <Pill tone={orderTone(c.status)}>
                          {statusLabels[c.status] ?? c.status}
                        </Pill>
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

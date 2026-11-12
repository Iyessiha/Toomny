import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminNavGroups } from "@/lib/admin-nav";
import { EmptyState } from "@/components/dashboard/shell";
import { Avatar, FilterTabs } from "@/components/dashboard/pro";
import { getMarketplaceTexts } from "@/i18n/marketplace";
import { visitorLocale } from "@/i18n/server-locale";
import { resolveDisplayNames } from "@/lib/names";

export async function generateMetadata(): Promise<Metadata> {
  return { title: `${getMarketplaceTexts(await visitorLocale()).messages.support.adminInbox} · Toomny Admin` };
}
export const dynamic = "force-dynamic";

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireAdmin();
  const locale = user.preferredLocale;
  const ts = getMarketplaceTexts(locale).messages.support;
  const sp = await searchParams;
  const tab = sp.tab === "closed" ? "closed" : "open";

  const db = createAdminClient();

  const { data: threads } = await db
    .from("support_threads")
    .select("id, subject, status, provider_id, last_message_at")
    .eq("status", tab)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(100);

  const providerIds = [...new Set((threads ?? []).map((t) => t.provider_id))];
  const profileMap = await resolveDisplayNames(providerIds);

  // Dernier message + non-lus par thread
  let lastBodyMap = new Map<string, string>();
  let unreadMap = new Map<string, number>();

  if (threads && threads.length > 0) {
    const threadIds = threads.map((t) => t.id);
    const { data: msgs } = await db
      .from("support_messages")
      .select("thread_id, body, sender_id, read_at, created_at")
      .in("thread_id", threadIds)
      .order("created_at", { ascending: false });

    for (const m of msgs ?? []) {
      if (!lastBodyMap.has(m.thread_id)) lastBodyMap.set(m.thread_id, m.body);
      // Non-lu du côté admin = messages envoyés par le prestataire sans read_at
      if (!m.read_at) {
        const th = threads.find((t) => t.id === m.thread_id);
        if (th && m.sender_id === th.provider_id) {
          unreadMap.set(m.thread_id, (unreadMap.get(m.thread_id) ?? 0) + 1);
        }
      }
    }
  }

  const rows = (threads ?? []).map((th) => ({
    ...th,
    providerName: profileMap.get(th.provider_id)?.name ?? null,
    providerInitials: profileMap.get(th.provider_id)?.initials ?? "?",
    lastBody: lastBodyMap.get(th.id) ?? null,
    unread: unreadMap.get(th.id) ?? 0,
  }));

  const openLabel = locale === "en" ? "Open" : "Ouverts";
  const closedLabel = locale === "en" ? "Closed" : "Fermés";

  return (
    <AdminShell
      user={user}
      locale={locale}
      kicker="Administration"
      title={ts.adminInbox}
      subtitle={ts.adminSubtitle}
      nav={getAdminNavGroups(locale, "/admin/messages")}
    >
      <FilterTabs
        items={[
          { href: "/admin/messages?tab=open", label: openLabel, current: tab === "open" },
          { href: "/admin/messages?tab=closed", label: closedLabel, current: tab === "closed" },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyState title={ts.adminEmpty} body={ts.adminEmptyBody} />
      ) : (
        <ul className="card mt-4 divide-y divide-[var(--border)] overflow-hidden">
          {rows.map((th) => (
            <li key={th.id}>
              <Link
                href={`/admin/messages/${th.id}`}
                className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-[var(--surface)]"
              >
                <span className="mt-0.5">
                  <Avatar name={th.providerName ?? th.providerInitials} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      {th.providerName && (
                        <p className="truncate text-sm font-semibold leading-tight">
                          {th.providerName}
                        </p>
                      )}
                      <span className={`truncate text-xs ${th.providerName ? "text-[var(--subtle)]" : "text-sm font-semibold"}`}>
                        {th.subject}
                      </span>
                    </div>
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
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}

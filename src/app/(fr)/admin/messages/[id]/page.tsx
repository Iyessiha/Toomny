import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { ThreadList } from "@/components/admin/thread-list";
import { getAdminNavGroups } from "@/lib/admin-nav";
import { getMarketplaceTexts } from "@/i18n/marketplace";
import { visitorLocale } from "@/i18n/server-locale";
import { ThreadSection } from "@/components/support/thread-section";
import { CloseThreadButton } from "@/components/support/close-thread-button";
import { resolveDisplayNames } from "@/lib/names";
import { loadAdminThreads, parseThreadTab } from "@/lib/admin-threads";
import { markThreadRead } from "@/app/(fr)/messages/support-actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: `${getMarketplaceTexts(await visitorLocale()).messages.support.adminInbox} · Toomny Admin` };
}
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireAdmin();
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const locale = user.preferredLocale;
  const ts = getMarketplaceTexts(locale).messages.support;
  const db = createAdminClient();

  const { data: thread } = await db
    .from("support_threads")
    .select("id, subject, status, provider_id, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!thread) notFound();

  // Marque les messages du prestataire comme lus AVANT de charger la liste : le compteur est ainsi à jour.
  await markThreadRead(id);

  const tab = parseThreadTab((await searchParams).tab);
  const [{ data: messages }, profileMap, list] = await Promise.all([
    db
      .from("support_messages")
      .select("id, body, sender_id, created_at, read_at")
      .eq("thread_id", id)
      .order("created_at", { ascending: true }),
    resolveDisplayNames([thread.provider_id]),
    loadAdminThreads(thread.status === "closed" ? "closed" : tab),
  ]);
  const providerName = profileMap.get(thread.provider_id)?.name ?? thread.provider_id.slice(0, 8);
  const activeTab = thread.status === "closed" ? "closed" : tab;

  return (
    <AdminShell
      user={user}
      locale={locale}
      kicker={ts.adminInbox}
      title={thread.subject}
      subtitle={providerName}
      nav={getAdminNavGroups(locale, "/admin/messages")}
    >
      <div className="grid gap-4 lg:h-[calc(100dvh-17rem)] lg:min-h-[520px] lg:grid-cols-[340px_minmax(0,1fr)]">
        <ThreadList
          rows={list.rows}
          counts={list.counts}
          tab={activeTab}
          activeId={id}
          locale={locale}
          emptyTitle={ts.adminEmpty}
          emptyBody={ts.adminEmptyBody}
          youLabel={locale === "en" ? "You" : "Vous"}
          className="hidden lg:flex"
        />
        <ThreadSection
          className="h-[calc(100dvh-14rem)] min-h-[480px] lg:h-full"
          threadId={thread.id}
          userId={user.id}
          isAdmin
          isClosed={thread.status === "closed"}
          initialMessages={messages ?? []}
          locale={locale}
          peerName={providerName}
          subject={thread.subject}
          statusLabel={thread.status === "open" ? ts.open : ts.closed}
          backHref={`/admin/messages?tab=${activeTab}`}
          headerActions={thread.status === "open" ? <CloseThreadButton threadId={thread.id} locale={locale} /> : undefined}
        />
      </div>
    </AdminShell>
  );
}

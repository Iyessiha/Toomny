import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminNavGroups } from "@/lib/admin-nav";
import { Pill } from "@/components/dashboard/pro";
import { getMarketplaceTexts } from "@/i18n/marketplace";
import { visitorLocale } from "@/i18n/server-locale";
import { ThreadSection } from "@/components/support/thread-section";
import { CloseThreadButton } from "@/components/support/close-thread-button";
import { AiDraftButton } from "@/components/support/ai-draft-button";
import { resolveDisplayNames } from "@/lib/names";
import { markThreadRead } from "@/app/(fr)/messages/support-actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: `${getMarketplaceTexts(await visitorLocale()).messages.support.adminInbox} · Toomny Admin` };
}
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
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

  const { data: messages } = await db
    .from("support_messages")
    .select("id, body, sender_id, created_at")
    .eq("thread_id", id)
    .order("created_at", { ascending: true });

  const profileMap = await resolveDisplayNames([thread.provider_id]);
  const providerName = profileMap.get(thread.provider_id)?.name ?? thread.provider_id.slice(0, 8);

  // Marquer les messages du prestataire comme lus (côté admin)
  await markThreadRead(id);

  return (
    <AdminShell
      user={user}
      locale={locale}
      kicker={ts.adminInbox}
      title={thread.subject}
      subtitle={providerName}
      nav={getAdminNavGroups(locale, "/admin/messages")}
    >
      <div className="mx-auto max-w-2xl space-y-6">
        {/* En-tête : statut + bouton fermer */}
        <div className="flex items-center justify-between">
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${
            thread.status === "open"
              ? "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300"
              : "bg-[var(--surface)] text-[var(--subtle)]"
          }`}>
            {thread.status === "open" ? ts.open : ts.closed}
          </span>
          {thread.status === "open" && (
            <CloseThreadButton threadId={thread.id} locale={locale} />
          )}
        </div>

        {thread.status === "open" && (
          <AiDraftButton threadId={thread.id} locale={locale} />
        )}

        <ThreadSection
          threadId={thread.id}
          userId={user.id}
          isAdmin={true}
          isClosed={thread.status === "closed"}
          initialMessages={messages ?? []}
          locale={locale}
        />
      </div>
    </AdminShell>
  );
}

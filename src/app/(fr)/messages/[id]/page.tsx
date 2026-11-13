import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/shell";
import { dashboardNavSections } from "@/lib/dashboard-nav";
import { getDashboardTexts } from "@/i18n/dashboard";
import { getMarketplaceTexts } from "@/i18n/marketplace";
import { ThreadSection } from "@/components/support/thread-section";
import { markThreadRead } from "@/app/(fr)/messages/support-actions";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata(): Promise<Metadata> {
  const user = await requireAuth();
  return { title: getMarketplaceTexts(user.preferredLocale).messages.support.metaTitle };
}

export default async function SupportThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  if (user.role === "admin") redirect("/admin/messages");

  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const locale = user.preferredLocale;
  const nav = getDashboardTexts(locale).nav;
  const ts = getMarketplaceTexts(locale).messages.support;
  const supabase = await createClient();

  const { data: thread } = await supabase
    .from("support_threads")
    .select("id, subject, status, provider_id")
    .eq("id", id)
    .maybeSingle();

  if (!thread || thread.provider_id !== user.id) notFound();

  const { data: messages } = await supabase
    .from("support_messages")
    .select("id, body, sender_id, created_at, read_at")
    .eq("thread_id", id)
    .order("created_at", { ascending: true });

  // Marquer les messages reçus comme lus
  await markThreadRead(id);

  return (
    <DashboardShell
      user={user}
      locale={locale}
      title={thread.subject}
      subtitle={ts.subtitle}
      navSections={dashboardNavSections(nav, user.role, "/messages")}
    >
      <div className="mx-auto max-w-3xl">
        <ThreadSection
          className="h-[calc(100dvh-13rem)] min-h-[460px]"
          threadId={thread.id}
          userId={user.id}
          isAdmin={false}
          isClosed={thread.status === "closed"}
          initialMessages={messages ?? []}
          locale={locale}
          peerName={locale === "en" ? "Toomny team" : "Équipe Toomny"}
          subject={thread.subject}
          statusLabel={thread.status === "open" ? ts.open : ts.closed}
          backHref="/messages"
        />
      </div>
    </DashboardShell>
  );
}

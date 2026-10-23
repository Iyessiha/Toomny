import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminNavGroups } from "@/lib/admin-nav";
import { ConversationList, type ConversationItem } from "@/components/messaging/conversation-list";
import { ConversationPane, type PaneRequest } from "@/components/messaging/conversation-pane";
import { ReadinessChecklist } from "@/components/messaging/readiness-checklist";
import { formatSubmittedAt } from "@/i18n/auth";
import { getAdminTexts } from "@/i18n/admin";
import { visitorLocale } from "@/i18n/server-locale";
import { attachmentsForRequests, signedUrlsFor } from "@/lib/support-attachments-server";
import { readinessForUser } from "@/lib/account-readiness-server";
import { buildThread, previewOf, type RawRequest } from "@/lib/support-view";
import { closeSupportRequest, draftSupportReply, replySupportRequest } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getAdminTexts(await visitorLocale()).nav.support };
}
export const dynamic = "force-dynamic";

const copy = {
  fr: {
    title: "Messagerie",
    subtitle: "Conversations avec les prestataires et clients. Votre réponse arrive dans leur espace.",
    toAnswer: "À répondre",
    waitingRequester: "En attente du demandeur",
    closed: "Traitée",
    close: "Clôturer",
    emptyList: "Aucune conversation pour l'instant.",
    emptyPane: "Sélectionnez une conversation.",
    newBadge: "Nouveau",
    team: "Équipe Toomny",
    closedLabel: "Traitée",
  },
  en: {
    title: "Messaging",
    subtitle: "Conversations with providers and clients. Your reply appears in their space.",
    toAnswer: "To answer",
    waitingRequester: "Waiting for requester",
    closed: "Closed",
    close: "Close",
    emptyList: "No conversation yet.",
    emptyPane: "Select a conversation.",
    newBadge: "New",
    team: "Toomny team",
    closedLabel: "Closed",
  },
} as const;

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const user = await requireAdmin();
  const locale = user.preferredLocale;
  const t = copy[locale];
  const { id: selectedParam } = await searchParams;

  const db = createAdminClient();
  const { data: rows } = await db
    .from("support_requests")
    .select(
      "id, subject, body, status, created_at, awaiting_admin, requester_seen_at, profile_id, profile:profiles(display_name, email), replies:support_replies(id, body, created_at, author_role, quoted_role, quoted_body)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const list = (rows ?? []).map((r) => {
    const profile = Array.isArray(r.profile) ? r.profile[0] : r.profile;
    return { ...r, profile, replies: r.replies ?? [] };
  });
  const attachments = await attachmentsForRequests(db, list.map((r) => r.id));
  const urls = await signedUrlsFor(db, attachments.filter((a) => a.reply_id !== null));

  const selected = list.find((r) => r.id === selectedParam) ?? list[0] ?? null;

  const items: ConversationItem[] = list.map((r) => {
    const isClosed = r.status === "closed";
    const tone = isClosed ? "neutral" : r.awaiting_admin ? "warning" : "neutral";
    return {
      id: r.id,
      title: r.subject,
      subtitle: r.profile?.display_name ?? r.profile?.email ?? null,
      preview: previewOf(r as RawRequest),
      timeLabel: formatSubmittedAt(
        r.replies.length ? [...r.replies].sort((a, b) => a.created_at.localeCompare(b.created_at)).at(-1)!.created_at : r.created_at,
        locale,
      ),
      unread: !isClosed && r.awaiting_admin,
      statusLabel: isClosed ? t.closed : r.awaiting_admin ? t.toAnswer : t.waitingRequester,
      statusTone: tone,
    };
  });

  let pane: PaneRequest | null = null;
  let messages: ReturnType<typeof buildThread> = [];
  let readinessNode: React.ReactNode = undefined;
  if (selected) {
    const isClosed = selected.status === "closed";
    pane = {
      id: selected.id,
      subject: selected.subject,
      closed: isClosed,
      requesterName: selected.profile?.display_name ?? "—",
      requesterEmail: selected.profile?.email ?? null,
      statusLabel: isClosed ? t.closed : selected.awaiting_admin ? t.toAnswer : t.waitingRequester,
      statusTone: isClosed ? "neutral" : selected.awaiting_admin ? "warning" : "neutral",
      createdLabel: formatSubmittedAt(selected.created_at, locale),
    };
    messages = buildThread(selected as RawRequest, attachments, urls, (iso) => formatSubmittedAt(iso, locale));
    const requester = await readinessForUser(db, selected.profile_id);
    if (requester) readinessNode = <ReadinessChecklist readiness={requester.readiness} locale={locale} />;
  }

  return (
    <AdminShell
      user={user}
      locale={locale}
      kicker="Administration"
      title={t.title}
      subtitle={t.subtitle}
      nav={getAdminNavGroups(locale, "/admin/support")}
    >
      <div className="grid gap-4 lg:h-[calc(100dvh-14rem)] lg:grid-cols-[340px_1fr]">
        <ConversationList
          items={items}
          selectedId={selected?.id ?? null}
          basePath="/admin/support"
          emptyLabel={t.emptyList}
          hidden={Boolean(selectedParam)}
        />
        {pane ? (
          <ConversationPane
            key={pane.id}
            viewer="admin"
            locale={locale}
            request={pane}
            messages={messages}
            backHref="/admin/support"
            sendAction={replySupportRequest}
            closeAction={closeSupportRequest}
            closeLabel={t.close}
            draftAction={draftSupportReply}
            readinessPanel={readinessNode}
          />
        ) : (
          <div className="flex items-center justify-center rounded-2xl border border-dashed border-[var(--border)] p-10 text-sm text-[var(--subtle)]">
            {t.emptyPane}
          </div>
        )}
      </div>
    </AdminShell>
  );
}

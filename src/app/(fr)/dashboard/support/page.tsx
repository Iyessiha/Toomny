import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DashboardShell } from "@/components/dashboard/shell";
import { dashboardNavSections } from "@/lib/dashboard-nav";
import { getDashboardTexts } from "@/i18n/dashboard";
import { SupportForm } from "@/components/dashboard/support-form";
import { SupportSeenMarker } from "@/components/dashboard/support-conversation";
import { Notice } from "@/components/dashboard/pro";
import { ConversationList, type ConversationItem } from "@/components/messaging/conversation-list";
import { ConversationPane, type PaneRequest } from "@/components/messaging/conversation-pane";
import { ReadinessChecklist } from "@/components/messaging/readiness-checklist";
import { formatSubmittedAt } from "@/i18n/auth";
import { visitorLocale } from "@/i18n/server-locale";
import { attachmentsForRequests, signedUrlsFor } from "@/lib/support-attachments-server";
import { readinessForUser } from "@/lib/account-readiness-server";
import { buildThread, hasUnreadTeamReply, previewOf, type RawRequest } from "@/lib/support-view";
import { replyToSupportRequest, resolveSupportRequest } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await visitorLocale();
  return { title: locale === "en" ? "Contact Toomny · Toomny" : "Contacter Toomny · Toomny" };
}
export const dynamic = "force-dynamic";

const copy = {
  fr: {
    title: "Contacter Toomny",
    subtitle: "Un problème avec une commande, un paiement ou votre compte ? Écrivez-nous ici.",
    newRequest: "Nouvelle demande",
    formTitle: "Nouvelle demande",
    note: "Votre demande arrive dans l'équipe Toomny. Pour un litige sur une commande, passez par la commande.",
    listTitle: "Mes conversations",
    empty: "Vous n'avez encore envoyé aucune demande.",
    emptyPane: "Sélectionnez une conversation, ou ouvrez une nouvelle demande.",
    awaitingTeam: "En attente de l'équipe",
    answered: "Répondue",
    closed: "Résolue",
    unread: "Nouvelle réponse",
    newReplyTitle: "L'équipe Toomny vous a répondu",
    newReplyBody: "Ouvrez la conversation ci-dessous pour lire la réponse.",
    resolve: "Ma demande est résolue",
    from: "De",
  },
  en: {
    title: "Contact Toomny",
    subtitle: "A problem with an order, a payment or your account? Write to us here.",
    newRequest: "New request",
    formTitle: "New request",
    note: "Your request goes to the Toomny team. For a dispute on an order, use the order page.",
    listTitle: "My conversations",
    empty: "You have not sent any request yet.",
    emptyPane: "Select a conversation, or open a new request.",
    awaitingTeam: "Waiting for the team",
    answered: "Answered",
    closed: "Resolved",
    unread: "New reply",
    newReplyTitle: "The Toomny team replied to you",
    newReplyBody: "Open the conversation below to read the reply.",
    resolve: "My request is resolved",
    from: "From",
  },
} as const;

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; nouveau?: string }>;
}) {
  const user = await requireAuth();
  const locale = user.preferredLocale;
  const t = copy[locale];
  const nav = getDashboardTexts(locale).nav;
  const { id: selectedParam, nouveau } = await searchParams;
  const newMode = nouveau === "1";

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("support_requests")
    .select(
      "id, subject, body, status, created_at, awaiting_admin, requester_seen_at, replies:support_replies(id, body, created_at, author_role, quoted_role, quoted_body)",
    )
    .order("created_at", { ascending: false })
    .limit(20);

  const list = (rows ?? []).map((r) => ({ ...r, replies: r.replies ?? [] }));
  const db = createAdminClient();
  const attachments = await attachmentsForRequests(db, list.map((r) => r.id));
  const urls = await signedUrlsFor(db, attachments.filter((a) => a.reply_id !== null));
  const readiness = await readinessForUser(db, user.id);

  const selected = newMode ? null : list.find((r) => r.id === selectedParam) ?? (selectedParam ? null : list[0] ?? null);

  const items: ConversationItem[] = list.map((r) => {
    const isClosed = r.status === "closed";
    const unread = !isClosed && hasUnreadTeamReply(r as RawRequest);
    const lastAt = [...r.replies].sort((a, b) => a.created_at.localeCompare(b.created_at)).at(-1)?.created_at ?? r.created_at;
    return {
      id: r.id,
      title: r.subject,
      subtitle: null,
      preview: previewOf(r as RawRequest),
      timeLabel: formatSubmittedAt(lastAt, locale),
      unread,
      statusLabel: isClosed ? t.closed : unread ? t.unread : r.awaiting_admin ? t.awaitingTeam : t.answered,
      statusTone: isClosed ? "neutral" : unread || r.awaiting_admin ? "warning" : "success",
    };
  });

  let pane: PaneRequest | null = null;
  let messages: ReturnType<typeof buildThread> = [];
  if (selected) {
    const isClosed = selected.status === "closed";
    pane = {
      id: selected.id,
      subject: selected.subject,
      closed: isClosed,
      requesterName: user.displayName ?? user.firstName ?? "",
      requesterEmail: null,
      statusLabel: isClosed ? t.closed : selected.awaiting_admin ? t.awaitingTeam : t.answered,
      statusTone: isClosed ? "neutral" : selected.awaiting_admin ? "warning" : "success",
      createdLabel: formatSubmittedAt(selected.created_at, locale),
      reopenable: false,
    };
    messages = buildThread(selected as RawRequest, attachments, urls, (iso) => formatSubmittedAt(iso, locale));
  }

  return (
    <DashboardShell
      user={user}
      kicker={nav.support}
      title={t.title}
      subtitle={t.subtitle}
      locale={locale}
      navSections={dashboardNavSections(nav, user.role, "/dashboard/support")}
    >
      <SupportSeenMarker />
      {items.some((i) => i.unread) && (
        <div className="mb-4">
          <Notice tone="info" title={t.newReplyTitle}>{t.newReplyBody}</Notice>
        </div>
      )}
      <div className="grid gap-4 lg:h-[calc(100dvh-14rem)] lg:grid-cols-[340px_1fr]">
        <div className={`${selectedParam || newMode ? "hidden lg:flex" : "flex"} min-h-0 flex-col gap-4`}>
          {readiness && <ReadinessChecklist readiness={readiness.readiness} locale={locale} />}
          <ConversationList
            items={items}
            selectedId={selected?.id ?? null}
            basePath="/dashboard/support"
            newHref="/dashboard/support?nouveau=1"
            newLabel={t.newRequest}
            emptyLabel={t.empty}
          />
        </div>

        {newMode ? (
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
            <Link href="/dashboard/support" className="mb-2 inline-block text-xs font-medium text-[var(--subtle)] lg:hidden">
              ← {t.listTitle}
            </Link>
            <h2 className="font-display text-base font-bold">{t.formTitle}</h2>
            <p className="mt-1 text-sm text-[var(--subtle)]">{t.note}</p>
            <div className="mt-4">
              <SupportForm locale={locale} />
            </div>
          </section>
        ) : pane ? (
          <ConversationPane
            key={pane.id}
            viewer="requester"
            locale={locale}
            request={pane}
            messages={messages}
            backHref="/dashboard/support"
            sendAction={replyToSupportRequest}
            closeAction={resolveSupportRequest}
            closeLabel={t.resolve}
          />
        ) : (
          <div className="flex items-center justify-center rounded-2xl border border-dashed border-[var(--border)] p-10 text-sm text-[var(--subtle)]">
            {t.emptyPane}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

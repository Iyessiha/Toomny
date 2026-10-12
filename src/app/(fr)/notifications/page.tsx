import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell, EmptyState } from "@/components/dashboard/shell";
import { getDashboardTexts } from "@/i18n/dashboard";
import { getMarketplaceTexts } from "@/i18n/marketplace";
import { getNotificationTexts } from "@/i18n/notifications";
import { renderNotification, toParams } from "@/lib/notifications";
import { markAllNotificationsRead, openNotification } from "./actions";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const user = await requireAuth();
  return { title: getNotificationTexts(user.preferredLocale).page.metaTitle };
}

const ICONS: Record<string, React.ReactNode> = {
  inquiry: (
    <path
      fillRule="evenodd"
      d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
      clipRule="evenodd"
    />
  ),
  order: (
    <path
      fillRule="evenodd"
      d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
      clipRule="evenodd"
    />
  ),
  dispute: (
    <path
      fillRule="evenodd"
      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
      clipRule="evenodd"
    />
  ),
  review: (
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  ),
  verification: (
    <path
      fillRule="evenodd"
      d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
      clipRule="evenodd"
    />
  ),
  payout: (
    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
  ),
};

function iconFor(type: string) {
  const family = type.split("_")[0];
  return ICONS[family] ?? ICONS.inquiry;
}

export default async function NotificationsPage() {
  const user = await requireAuth();
  const locale = user.preferredLocale;
  const t = getNotificationTexts(locale).page;
  const nav = getDashboardTexts(locale).nav;
  const supabase = await createClient();

  // RLS : seules mes notifications sont lisibles.
  const { data: rows } = await supabase
    .from("notifications")
    .select("id, type, params, link, read_at, created_at")
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const items = (rows ?? [])
    .map((row) => {
      const rendered = renderNotification(String(row.type), toParams(row.params), locale);
      if (!rendered) return null;
      return {
        id: String(row.id),
        title: rendered.title,
        body: rendered.body,
        type: String(row.type),
        unread: row.read_at == null,
        at: new Date(String(row.created_at)),
      };
    })
    .filter((n): n is NonNullable<typeof n> => n !== null);

  const unreadCount = items.filter((n) => n.unread).length;
  const dateTag = locale === "en" ? "en-GB" : "fr-FR";

  return (
    <DashboardShell
      user={user}
      locale={locale}
      title={t.title}
      subtitle={t.subtitle}
      nav={[
        { href: "/dashboard", label: nav.overview },
        { href: "/orders", label: nav.orders },
        { href: "/messages", label: nav.messages },
        { href: "/demandes", label: nav.inquiries },
        { href: "/disputes", label: getMarketplaceTexts(locale).disputes.title },
      ]}
    >
      {items.length === 0 ? (
        <EmptyState title={t.emptyTitle} body={t.emptyBody} />
      ) : (
        <>
          {unreadCount > 0 && (
            <form action={markAllNotificationsRead} className="mb-4 flex justify-end">
              <button
                type="submit"
                className="rounded-full border border-[var(--border)] px-4 py-1.5 text-sm font-medium text-[var(--subtle)] transition-colors hover:border-[var(--color-brand-400)] hover:text-[var(--foreground)]"
              >
                {t.markAll}
              </button>
            </form>
          )}
          <ul className="space-y-2.5">
            {items.map((n) => (
              <li key={n.id}>
                <form action={openNotification}>
                  <input type="hidden" name="id" value={n.id} />
                  <button
                    type="submit"
                    className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${
                      n.unread
                        ? "border-[var(--color-brand-200)] bg-[var(--color-brand-50)] hover:border-[var(--color-brand-400)]"
                        : "border-[var(--border)] bg-[var(--background)] hover:border-[var(--color-brand-400)]"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`flex h-9 w-9 flex-none items-center justify-center rounded-full ${
                        n.unread
                          ? "bg-[var(--color-brand-500)] text-white"
                          : "bg-[var(--surface)] text-[var(--subtle)]"
                      }`}
                    >
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        {iconFor(n.type)}
                      </svg>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold">{n.title}</span>
                        {n.unread && (
                          <span
                            aria-hidden
                            className="h-2 w-2 flex-none rounded-full bg-[var(--color-brand-500)]"
                          />
                        )}
                      </span>
                      <span className="mt-0.5 block text-sm leading-relaxed text-[var(--subtle)]">
                        {n.body}
                      </span>
                      <span className="mt-1 block text-xs text-[var(--subtle)]">
                        {n.at.toLocaleDateString(dateTag, { day: "numeric", month: "short" })}
                        {" · "}
                        {n.at.toLocaleTimeString(dateTag, { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </span>
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </>
      )}
    </DashboardShell>
  );
}

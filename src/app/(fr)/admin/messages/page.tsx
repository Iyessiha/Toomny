import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";
import { ThreadList } from "@/components/admin/thread-list";
import { getAdminNavGroups } from "@/lib/admin-nav";
import { getMarketplaceTexts } from "@/i18n/marketplace";
import { visitorLocale } from "@/i18n/server-locale";
import { loadAdminThreads, parseThreadTab } from "@/lib/admin-threads";

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
  const tab = parseThreadTab((await searchParams).tab);
  const { rows, counts } = await loadAdminThreads(tab);

  return (
    <AdminShell
      user={user}
      locale={locale}
      kicker="Administration"
      title={ts.adminInbox}
      subtitle={ts.adminSubtitle}
      nav={getAdminNavGroups(locale, "/admin/messages")}
    >
      <div className="grid gap-4 lg:h-[calc(100dvh-17rem)] lg:min-h-[520px] lg:grid-cols-[360px_minmax(0,1fr)]">
        <ThreadList
          rows={rows}
          counts={counts}
          tab={tab}
          locale={locale}
          emptyTitle={ts.adminEmpty}
          emptyBody={ts.adminEmptyBody}
          youLabel={locale === "en" ? "You" : "Vous"}
          className="max-h-[70dvh] lg:max-h-none"
        />
        <div className="glass hidden flex-col items-center justify-center gap-3 p-8 text-center lg:flex">
          <span aria-hidden className="glass-icon glass-icon-brand h-16 w-16">
            <svg className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.84 8.84 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" clipRule="evenodd" />
            </svg>
          </span>
          <p className="font-display text-lg font-bold">{locale === "en" ? "Select a conversation" : "Choisissez une conversation"}</p>
          <p className="max-w-xs text-sm text-[var(--subtle)]">
            {locale === "en" ? "Messages are delivered live; unread threads glow." : "Les messages arrivent en direct ; les fils non lus sont mis en avant."}
          </p>
        </div>
      </div>
    </AdminShell>
  );
}

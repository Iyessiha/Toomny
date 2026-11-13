import Link from "next/link";
import { Avatar } from "@/components/admin/glass";
import type { AdminThreadRow, AdminThreadTab } from "@/lib/admin-threads";
import type { Locale } from "@/i18n/dictionaries";

const TABS: { key: AdminThreadTab; fr: string; en: string }[] = [
  { key: "open", fr: "Ouverts", en: "Open" },
  { key: "unread", fr: "Non lus", en: "Unread" },
  { key: "closed", fr: "Fermés", en: "Closed" },
];

function shortWhen(iso: string | null, locale: Locale) {
  if (!iso) return "";
  const d = new Date(iso);
  const sameDay = new Date().toDateString() === d.toDateString();
  return sameDay
    ? d.toLocaleTimeString(locale === "en" ? "en-GB" : "fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Abidjan" })
    : d.toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR", { day: "numeric", month: "short", timeZone: "Africa/Abidjan" });
}

/** Colonne « conversations » de la messagerie admin : onglets, lignes, point lumineux des non-lus. */
export function ThreadList({
  rows,
  counts,
  tab,
  activeId,
  locale,
  emptyTitle,
  emptyBody,
  youLabel,
  className = "",
}: {
  rows: AdminThreadRow[];
  counts: Record<AdminThreadTab, number>;
  tab: AdminThreadTab;
  activeId?: string;
  locale: Locale;
  emptyTitle: string;
  emptyBody: string;
  youLabel: string;
  className?: string;
}) {
  return (
    <aside className={`glass glass-dense flex min-h-0 flex-col overflow-hidden ${className}`}>
      <nav className="flex flex-none gap-2 border-b border-[var(--border)] p-3" aria-label="Filtre">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/messages?tab=${t.key}`}
            aria-current={t.key === tab ? "page" : undefined}
            className={t.key === tab ? "chip chip-active" : "chip"}
          >
            {locale === "en" ? t.en : t.fr}
            <span className="chip-count">{counts[t.key]}</span>
          </Link>
        ))}
      </nav>

      <div className="chat-scroll !p-2" style={{ background: "transparent" }}>
        {rows.length === 0 ? (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center px-6 text-center">
            <p className="font-display text-sm font-bold">{emptyTitle}</p>
            <p className="mt-1 text-xs text-[var(--subtle)]">{emptyBody}</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {rows.map((th) => (
              <li key={th.id}>
                <Link
                  href={`/admin/messages/${th.id}?tab=${tab}`}
                  aria-current={th.id === activeId ? "page" : undefined}
                  className={`thread-row ${th.unread > 0 ? "thread-row-unread" : ""}`}
                >
                  <Avatar name={th.providerName} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={`truncate text-sm leading-tight ${th.unread > 0 ? "font-extrabold" : "font-semibold"}`}>{th.providerName}</p>
                      <span className="flex-none text-[11px] text-[var(--subtle)]">{shortWhen(th.lastAt, locale)}</span>
                    </div>
                    <p className="truncate text-xs font-medium text-[var(--brand-text-1)]">{th.subject}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <p className={`min-w-0 flex-1 truncate text-xs ${th.unread > 0 ? "text-[var(--foreground)]" : "text-[var(--subtle)]"}`}>
                        {th.lastBody ? `${th.lastFromProvider ? "" : `${youLabel} : `}${th.lastBody}` : "—"}
                      </p>
                      {th.unread > 0 && (
                        <span className="flex-none rounded-full bg-gradient-to-br from-[#8bf0b6] to-[#33d17a] px-2 py-px text-[10px] font-extrabold text-[#04110b] shadow-[0_0_12px_-2px_rgba(79,220,140,0.9)]">
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
      </div>
    </aside>
  );
}

import Link from "next/link";

export type ConversationItem = {
  id: string;
  title: string;
  /** Nom du correspondant (côté admin) ou libellé secondaire. */
  subtitle: string | null;
  preview: string;
  timeLabel: string;
  unread: boolean;
  statusLabel: string;
  statusTone: "neutral" | "warning" | "success";
};

const TONE: Record<ConversationItem["statusTone"], string> = {
  neutral: "bg-[var(--surface)] text-[var(--subtle)]",
  warning: "bg-[var(--tone-warning-bg)] text-[var(--tone-warning-fg)]",
  success: "bg-[var(--tone-success-bg)] text-[var(--tone-success-fg)]",
};

/** Liste des conversations : un clic ouvre le fil à droite (ou sur mobile, en plein écran). */
export function ConversationList({
  items,
  selectedId,
  basePath,
  newHref,
  newLabel,
  emptyLabel,
  hidden,
}: {
  items: ConversationItem[];
  selectedId: string | null;
  basePath: string;
  newHref?: string;
  newLabel?: string;
  emptyLabel: string;
  /** Sur mobile, la liste disparaît quand un fil est ouvert. */
  hidden?: boolean;
}) {
  return (
    <aside className={`${hidden ? "hidden lg:flex" : "flex"} min-h-0 flex-col rounded-2xl border border-[var(--border)] bg-[var(--background)]`}>
      {newHref && newLabel && (
        <div className="border-b border-[var(--border)] p-3">
          <Link href={newHref} className="btn-primary btn-sm w-full justify-center">
            {newLabel}
          </Link>
        </div>
      )}
      {items.length === 0 ? (
        <p className="p-5 text-sm text-[var(--subtle)]">{emptyLabel}</p>
      ) : (
        <ul className="min-h-0 flex-1 divide-y divide-[var(--border)] overflow-y-auto" aria-label={emptyLabel}>
          {items.map((item) => {
            const active = item.id === selectedId;
            return (
              <li key={item.id}>
                <Link
                  href={`${basePath}?id=${item.id}`}
                  aria-current={active ? "true" : undefined}
                  className={`block px-4 py-3 transition-colors hover:bg-[var(--surface)] ${active ? "bg-[var(--surface)] shadow-[inset_3px_0_0_var(--color-brand-500)]" : ""}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className={`truncate text-sm ${item.unread ? "font-bold" : "font-semibold"}`}>
                      {item.unread && <span aria-label="Non lu" className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[var(--color-brand-500)] align-middle" />}
                      {item.title}
                    </p>
                    <time className="shrink-0 text-[11px] text-[var(--subtle)]">{item.timeLabel}</time>
                  </div>
                  {item.subtitle && <p className="truncate text-xs text-[var(--subtle)]">{item.subtitle}</p>}
                  <p className="mt-1 truncate text-xs text-[var(--subtle)]">{item.preview}</p>
                  <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${TONE[item.statusTone]}`}>
                    {item.statusLabel}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}

import Link from "next/link";
import { ageLabel } from "@/lib/admin-age";
import type { QueueItem } from "@/lib/admin-queue";

/** File de travail : chaque ligne est un élément à traiter, avec son action directe. */
export function WorkQueue({ items, emptyLabel }: { items: QueueItem[]; emptyLabel: string }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--subtle)]">
        {emptyLabel}
      </div>
    );
  }

  const now = new Date();

  return (
    <ul className="divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]">
      {items.map((item) => (
        <li
          key={item.key}
          className={`flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between ${
            item.urgent ? "bg-[var(--tone-danger-bg)]/40" : ""
          }`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={`h-2 w-2 flex-none rounded-full ${item.urgent ? "bg-[var(--tone-danger-fg)]" : "bg-[var(--color-brand-500)]"}`}
              aria-hidden
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--subtle)]">{item.label}</p>
              <p className="truncate text-sm font-semibold text-[var(--foreground)]">{item.title}</p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <span className={`text-xs font-semibold ${item.urgent ? "text-[var(--tone-danger-fg)]" : "text-[var(--subtle)]"}`}>
              {ageLabel(item.createdAt, now)}
            </span>
            <Link href={item.href} className="btn-primary btn-sm whitespace-nowrap">
              {item.actionLabel}
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

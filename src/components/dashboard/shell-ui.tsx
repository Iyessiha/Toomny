import Link from "next/link";

// Briques de présentation partagées entre le shell connecté (serveur) et les
// composants clients (ex. service-manage). Ce module ne doit JAMAIS importer
// de code serveur (next/headers, supabase/server…) : il est compilé aussi
// pour le navigateur.

export type NavItem = { href: string; label: string; current?: boolean };

export function StatCard({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`app-lift rounded-2xl border p-5 ${
        accent
          ? "border-[var(--color-brand-200)] bg-[var(--color-brand-50)]"
          : "border-[var(--border)] bg-[var(--background)]"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--subtle)]">{label}</p>
      <p
        className={`mt-2 font-display text-2xl font-bold ${
          accent ? "text-[var(--color-brand-700)]" : ""
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-[var(--subtle)]">{hint}</p>}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background)] px-6 py-14 text-center">
      <h3 className="font-display text-base font-bold">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[var(--subtle)]">{body}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-6 inline-flex rounded-full bg-[var(--color-brand-500)] px-6 py-2.5 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.03] active:scale-95"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

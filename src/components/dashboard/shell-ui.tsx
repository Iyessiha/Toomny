import Link from "next/link";

// Briques de présentation partagées entre le shell connecté (serveur) et les
// composants clients (ex. service-manage). Ce module ne doit JAMAIS importer
// de code serveur (next/headers, supabase/server…) : il est compilé aussi
// pour le navigateur.

export type NavItem = {
  href: string;
  label: string;
  current?: boolean;
  /** Badge fixe (ex. compteur passé par la page). */
  badge?: number;
  /** Clé d'un compteur fourni par le layout du tableau de bord (voir nav-badges). */
  badgeKey?: string;
};
export type NavSection = { title: string; items: NavItem[] };

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
      <span
        aria-hidden
        className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--color-brand-600)]"
      >
        <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2H3V4z" />
          <path
            fillRule="evenodd"
            d="M3 7h14v9a1 1 0 01-1 1H4a1 1 0 01-1-1V7zm3 3a1 1 0 011-1h2a1 1 0 010 2H7a1 1 0 01-1-1zm6 0a1 1 0 011-1h1a1 1 0 010 2h-1a1 1 0 01-1-1z"
            clipRule="evenodd"
          />
        </svg>
      </span>
      <h3 className="font-display text-base font-bold">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[var(--subtle)]">{body}</p>
      {action && (
        <Link href={action.href} className="btn-primary mt-6 inline-flex">
          {action.label}
        </Link>
      )}
    </div>
  );
}

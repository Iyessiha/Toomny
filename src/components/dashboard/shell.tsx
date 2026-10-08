import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { SignOutButton } from "./sign-out";
import { getDashboardTexts } from "@/i18n/dashboard";
import type { Locale } from "@/i18n/dictionaries";

export type NavItem = { href: string; label: string; current?: boolean };

export function DashboardShell({
  user,
  nav,
  title,
  subtitle,
  locale = "fr",
  children,
}: {
  user: { displayName: string | null; email: string | null; role: string };
  nav: NavItem[];
  title: string;
  subtitle?: string;
  locale?: Locale;
  children: React.ReactNode;
}) {
  const t = getDashboardTexts(locale);
  const initials = (user.displayName ?? user.email ?? "?")
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <div className="min-h-dvh bg-[var(--surface)]">
      <header className="border-b border-[var(--border)] bg-[var(--background)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="text-[var(--color-brand-500)]" aria-label="Toomny">
            <Logo size={28} />
          </Link>
          <div className="flex items-center gap-4">
            <SignOutButton label={t.shell.signOut} />
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-brand-100)] font-display text-xs font-bold text-[var(--color-brand-700)]"
              title={user.email ?? undefined}
            >
              {initials}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
          {subtitle && <p className="text-sm text-[var(--subtle)]">{subtitle}</p>}
        </div>

        {nav.length > 0 && (
          <nav className="mt-7 flex gap-1 overflow-x-auto border-b border-[var(--border)] pb-px">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  n.current
                    ? "border-b-2 border-[var(--color-brand-500)] text-[var(--foreground)]"
                    : "text-[var(--subtle)] hover:text-[var(--foreground)]"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="app-enter mt-8">{children}</div>
      </div>
    </div>
  );
}

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

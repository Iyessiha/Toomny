import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { SignOutButton } from "./sign-out";
import { NotificationBell } from "./notification-bell";
import { getDashboardTexts } from "@/i18n/dashboard";
import { getAdminTexts } from "@/i18n/admin";
import type { Locale } from "@/i18n/dictionaries";

import type { NavItem } from "./shell-ui";

export type { NavItem } from "./shell-ui";
export { EmptyState, StatCard } from "./shell-ui";

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
  const isAdmin = user.role === "admin";
  const tAdmin = isAdmin ? getAdminTexts(locale) : null;

  const initials = (user.displayName ?? user.email ?? "?")
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  const adminNavItems: NavItem[] = tAdmin
    ? [
        { href: "/admin", label: tAdmin.nav.overview },
        { href: "/admin/verifications", label: tAdmin.nav.kyc },
        { href: "/admin/services", label: tAdmin.nav.services },
        { href: "/admin/categories", label: tAdmin.nav.categories },
        { href: "/admin/users", label: tAdmin.nav.users },
        { href: "/admin/orders", label: tAdmin.nav.orders },
        { href: "/admin/disputes", label: locale === "en" ? "Disputes" : "Litiges" },
      ]
    : [];

  // Nav without the legacy /admin single-link (now shown as a section)
  const mainNav = nav.filter((n) => n.href !== "/admin");

  return (
    <div className="min-h-dvh bg-[var(--surface)]">
      {/* ── Mobile top bar ── */}
      <header className="flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--background)] px-4 sm:hidden">
        <Link href="/" className="text-[var(--color-brand-500)]" aria-label="Toomny">
          <Logo size={24} withWordmark={false} />
        </Link>
        <span className="font-display text-sm font-bold">{title}</span>
        <div className="flex items-center gap-1">
          <NotificationBell locale={locale} />
          <SignOutButton label={t.shell.signOut} compact />
        </div>
      </header>

      {/* ── Mobile horizontal nav ── */}
      {mainNav.length > 0 && (
        <nav className="flex gap-1 overflow-x-auto border-b border-[var(--border)] bg-[var(--background)] px-3 pb-px sm:hidden">
          {[...mainNav, ...adminNavItems].map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`whitespace-nowrap rounded-t-lg px-3 py-2.5 text-sm font-medium transition-colors ${
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

      <div className="flex">
        {/* ── Desktop left sidebar ── */}
        <aside className="hidden sm:flex sm:w-60 sm:shrink-0 sm:flex-col sm:min-h-[calc(100dvh-0px)] sm:border-r sm:border-[var(--border)] sm:bg-[var(--background)]">
          {/* Brand */}
          <div className="flex h-16 items-center gap-3 border-b border-[var(--border)] px-5">
            <Link href="/" className="text-[var(--color-brand-500)]" aria-label="Toomny">
              <Logo size={26} withWordmark={false} />
            </Link>
            <span className="font-display text-sm font-bold leading-tight">Toomny</span>
            <div className="ml-auto">
              <NotificationBell locale={locale} />
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-3 py-5">
            <ul className="space-y-0.5">
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      item.current
                        ? "bg-[var(--color-brand-500)] text-white"
                        : "text-[var(--subtle)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    <DashNavIcon href={item.href} active={!!item.current} />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            {adminNavItems.length > 0 && (
              <>
                <div className="mt-6 mb-2 px-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--subtle)]">
                    Administration
                  </p>
                </div>
                <ul className="space-y-0.5">
                  {adminNavItems.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--subtle)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
                      >
                        <AdminNavIcon href={item.href} />
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </nav>

          {/* Footer */}
          <div className="border-t border-[var(--border)] px-4 py-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-100)] font-display text-xs font-bold text-[var(--color-brand-700)]">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">{user.displayName ?? "—"}</p>
                <p className="truncate text-xs text-[var(--subtle)]">{user.email}</p>
              </div>
            </div>
            <SignOutButton label={t.shell.signOut} />
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
            <div className="mb-8">
              <h1 className="font-display text-2xl font-bold sm:text-3xl">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-[var(--subtle)]">{subtitle}</p>}
            </div>
            <div className="app-enter">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ── Dashboard nav icons ──────────────────────────────────────────────────────

function DashNavIcon({ href, active }: { href: string; active: boolean }) {
  const cls = `h-4 w-4 shrink-0 ${active ? "text-white" : "text-[var(--subtle)]"}`;

  if (href === "/dashboard")
    return (
      <svg className={cls} viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 11l8-8 8 8v7a1 1 0 01-1 1H3a1 1 0 01-1-1v-7z" />
      </svg>
    );
  if (href === "/dashboard/prestations")
    return (
      <svg className={cls} viewBox="0 0 20 20" fill="currentColor">
        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
      </svg>
    );
  if (href === "/dashboard/profil")
    return (
      <svg className={cls} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
      </svg>
    );
  if (href === "/dashboard/verification")
    return (
      <svg className={cls} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    );
  if (href === "/orders")
    return (
      <svg className={cls} viewBox="0 0 20 20" fill="currentColor">
        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
        <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
      </svg>
    );
  if (href === "/messages")
    return (
      <svg className={cls} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
      </svg>
    );
  if (href === "/dashboard/versements")
    return (
      <svg className={cls} viewBox="0 0 20 20" fill="currentColor">
        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
      </svg>
    );
  // fallback
  return (
    <svg className={cls} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
    </svg>
  );
}

function AdminNavIcon({ href }: { href: string }) {
  const cls = "h-4 w-4 shrink-0 text-amber-500";

  if (href === "/admin")
    return (
      <svg className={cls} viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 11l8-8 8 8v7a1 1 0 01-1 1H3a1 1 0 01-1-1v-7z" />
      </svg>
    );
  if (href === "/admin/verifications")
    return (
      <svg className={cls} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
      </svg>
    );
  if (href === "/admin/services")
    return (
      <svg className={cls} viewBox="0 0 20 20" fill="currentColor">
        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
      </svg>
    );
  if (href === "/admin/categories")
    return (
      <svg className={cls} viewBox="0 0 20 20" fill="currentColor">
        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 8a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zm6-6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zm0 8a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    );
  if (href === "/admin/users")
    return (
      <svg className={cls} viewBox="0 0 20 20" fill="currentColor">
        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zm8 0a3 3 0 11-6 0 3 3 0 016 0zM2 16a6 6 0 0112 0H2zm14 0a6 6 0 00-9.33-5.26A6.001 6.001 0 0118 16h-2z" />
      </svg>
    );
  if (href === "/admin/orders")
    return (
      <svg className={cls} viewBox="0 0 20 20" fill="currentColor">
        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
        <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
      </svg>
    );
  // disputes
  return (
    <svg className={cls} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  );
}

import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { SignOutButton } from "@/components/dashboard/sign-out";
import { getDashboardTexts } from "@/i18n/dashboard";
import { getAdminTexts } from "@/i18n/admin";
import type { Locale } from "@/i18n/dictionaries";

export type NavItem = { href: string; label: string; current?: boolean };

export function AdminShell({
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
  const tDash = getDashboardTexts(locale);
  const tAdmin = getAdminTexts(locale);

  const initials = (user.displayName ?? user.email ?? "?")
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <div className="min-h-dvh bg-[var(--surface)]">
      {/* Mobile top bar */}
      <header className="flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--background)] px-4 sm:hidden">
        <Link href="/" className="text-[var(--color-brand-500)]">
          <Logo size={24} />
        </Link>
        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-amber-800">
          Admin
        </span>
        <SignOutButton label={tDash.shell.signOut} />
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden sm:flex sm:w-60 sm:flex-shrink-0 sm:flex-col sm:min-h-dvh sm:border-r sm:border-[var(--border)] sm:bg-[var(--background)]">
          {/* Brand */}
          <div className="flex h-16 items-center gap-3 border-b border-[var(--border)] px-5">
            <Link href="/" className="text-[var(--color-brand-500)]">
              <Logo size={26} withWordmark={false} />
            </Link>
            <div>
              <span className="block font-display text-sm font-bold leading-tight">
                Toomny
              </span>
              <span className="block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 w-fit mt-0.5">
                Admin
              </span>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-3 py-5">
            <ul className="space-y-1">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      item.current
                        ? "bg-[var(--color-brand-500)] text-white"
                        : "text-[var(--subtle)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    <NavIcon href={item.href} active={!!item.current} />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* User footer */}
          <div className="border-t border-[var(--border)] px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-100)] font-display text-xs font-bold text-[var(--color-brand-700)]">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">{user.displayName ?? "—"}</p>
                <p className="truncate text-xs text-[var(--subtle)]">
                  {tAdmin.roles[user.role] ?? user.role}
                </p>
              </div>
            </div>
            <SignOutButton label={tDash.shell.signOut} />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div className="px-5 py-8 sm:px-8 sm:py-10 max-w-5xl">
            <div className="mb-8">
              <h1 className="font-display text-2xl font-bold sm:text-3xl">{title}</h1>
              {subtitle && (
                <p className="mt-1 text-sm text-[var(--subtle)]">{subtitle}</p>
              )}
            </div>
            <div className="app-enter">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}

function NavIcon({ href, active }: { href: string; active: boolean }) {
  const cls = `h-4 w-4 shrink-0 ${active ? "text-white" : "text-[var(--subtle)]"}`;

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
  if (href === "/admin/disputes")
    return (
      <svg className={cls} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    );
  // fallback: Mon dashboard
  return (
    <svg className={cls} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
  );
}

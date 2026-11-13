import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { SignOutButton } from "@/components/dashboard/sign-out";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { Avatar } from "@/components/admin/glass";
import { getDashboardTexts } from "@/i18n/dashboard";
import { getAdminTexts } from "@/i18n/admin";
import type { Locale } from "@/i18n/dictionaries";
import type { NavItem, NavGroup } from "@/lib/admin-nav";
import { flattenNavGroups } from "@/lib/admin-nav";
import { getAdminNavCounts } from "@/lib/admin-counts";

export type { NavItem, NavGroup };

export async function AdminShell({
  user,
  nav: navBase,
  title,
  subtitle,
  kicker,
  actions,
  locale = "fr",
  children,
}: {
  user: { displayName: string | null; email: string | null; role: string };
  nav: NavGroup[];
  title: string;
  subtitle?: string;
  kicker?: string;
  actions?: React.ReactNode;
  locale?: Locale;
  children: React.ReactNode;
}) {
  const tDash = getDashboardTexts(locale);
  const tAdmin = getAdminTexts(locale);
  const adminNav = getAdminTexts(locale).nav;
  const displayName = user.displayName ?? user.email ?? "?";
  const counts = await getAdminNavCounts();
  const nav: NavGroup[] = navBase.map((group) => ({
    ...group,
    items: group.items.map((item) => (counts[item.href] ? { ...item, badge: counts[item.href] } : item)),
  }));
  const flatNav = flattenNavGroups(nav);

  const searchPlaceholder =
    locale === "en" ? "Search an account, an order, a service…" : "Rechercher un compte, une commande, une prestation…";

  return (
    <div className="adm-root">
      <div className="adm-aurora" aria-hidden>
        <i />
        <i />
        <i />
      </div>

      {/* ── Mobile : barre du haut en verre ── */}
      <header className="glass glass-dense sticky top-2 z-40 mx-2 mt-2 flex h-14 items-center justify-between gap-3 px-4 sm:hidden" style={{ borderRadius: 18 }}>
        <Link href="/" className="text-[var(--brand-text-2)]" aria-label="Toomny">
          <Logo size={24} withWordmark={false} />
        </Link>
        <span className="truncate font-display text-sm font-bold">{title}</span>
        <div className="flex flex-none items-center gap-1">
          <Link href="/admin/recherche" aria-label={searchPlaceholder} className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--subtle)] hover:bg-white/10 hover:text-[var(--foreground)]">
            <SearchIcon />
          </Link>
          <NotificationBell locale={locale} />
        </div>
      </header>

      {/* ── Mobile : navigation en pastilles de verre ── */}
      {flatNav.length > 0 && (
        <nav className="mx-2 mt-2 flex gap-2 overflow-x-auto px-1 py-1 sm:hidden" aria-label="Admin">
          {flatNav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={n.current ? "page" : undefined}
              className={`chip ${n.current ? "chip-active" : ""}`}
            >
              {n.label}
              {n.badge && n.badge.count > 0 && <span className="chip-count">{n.badge.count}</span>}
            </Link>
          ))}
        </nav>
      )}

      <div className="flex">
        {/* ── Barre latérale flottante ── */}
        <aside className="hidden sm:sticky sm:top-0 sm:flex sm:max-h-dvh sm:min-h-dvh sm:w-[276px] sm:shrink-0 sm:flex-col">
          <div className="glass glass-dense m-3 flex min-h-0 flex-1 flex-col overflow-hidden">
            {/* Marque */}
            <div className="flex h-[68px] flex-none items-center gap-3 border-b border-[var(--border)] px-5">
              <Link href="/" className="text-[var(--brand-text-2)] drop-shadow-[0_0_10px_rgba(139,240,182,0.55)]" aria-label="Toomny">
                <Logo size={28} withWordmark={false} />
              </Link>
              <div className="leading-none">
                <span className="font-display text-base font-extrabold tracking-tight">
                  Toomny<span className="text-[var(--gold)]">.</span>
                </span>
                <span className="mt-1.5 block w-fit rounded-full border border-[rgba(224,181,102,0.35)] bg-[var(--tone-warning-bg)] px-2 py-px text-[9px] font-extrabold uppercase tracking-[0.16em] text-[var(--tone-warning-fg)]">
                  Admin
                </span>
              </div>
              <div className="ml-auto">
                <NotificationBell locale={locale} />
              </div>
            </div>

            {/* Navigation groupée */}
            <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4" aria-label="Admin">
              {nav.map((group, gi) => (
                <div key={gi} className={gi > 0 ? "mt-5" : ""}>
                  {group.label && (
                    <p className="mb-1.5 px-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--subtle)]/80">
                      {group.label}
                    </p>
                  )}
                  <ul className="space-y-1">
                    {group.items.map((item) => (
                      <li key={item.href}>
                        <Link href={item.href} aria-current={item.current ? "page" : undefined} className="adm-nav-item">
                          <NavIcon href={item.href} />
                          {item.label}
                          {item.badge && item.badge.count > 0 && (
                            <span
                              className={`ml-auto rounded-full border px-2 py-px text-[11px] font-bold tabular-nums ${
                                item.badge.attention
                                  ? "border-[rgba(255,138,132,0.35)] bg-[var(--tone-danger-bg)] text-[var(--tone-danger-fg)] shadow-[0_0_12px_-2px_rgba(255,138,132,0.6)]"
                                  : "border-[rgba(120,180,255,0.3)] bg-[var(--tone-info-bg)] text-[var(--tone-info-fg)]"
                              }`}
                            >
                              {item.badge.count}
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {/* Retour au tableau de bord : toujours en bas */}
              <div className="mt-6 border-t border-[var(--border)] pt-4">
                <Link href="/dashboard" className="adm-nav-item">
                  <svg className="adm-nav-icon h-[18px] w-[18px] shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                    <path d="M2 11l8-8 8 8v7a1 1 0 01-1 1H3a1 1 0 01-1-1v-7z" />
                  </svg>
                  {adminNav.myDashboard}
                </Link>
              </div>
            </nav>

            {/* Profil */}
            <div className="flex-none border-t border-[var(--border)] p-3">
              <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white/[0.04] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <Avatar name={displayName} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{displayName}</p>
                  <p className="truncate text-xs text-[var(--subtle)]">{tAdmin.roles[user.role] ?? user.role}</p>
                </div>
              </div>
              <div className="mt-2 px-1">
                <SignOutButton label={tDash.shell.signOut} />
              </div>
            </div>
          </div>
        </aside>

        {/* ── Contenu ── */}
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-6xl px-4 pb-12 pt-3 sm:px-6 sm:pt-3">
            {/* Barre de commande collée en haut (écran large) */}
            <div className="adm-topbar glass glass-dense hidden items-center gap-3 px-3 py-2 sm:flex" style={{ borderRadius: 9999 }}>
              <form action="/admin/recherche" method="get" role="search" className="adm-search min-w-0 flex-1">
                <SearchIcon />
                <input name="q" placeholder={searchPlaceholder} aria-label={locale === "en" ? "Search" : "Rechercher"} />
                <kbd className="hidden rounded-md border border-[var(--border)] bg-white/5 px-1.5 py-px text-[10px] font-semibold text-[var(--subtle)] lg:block">↵</kbd>
              </form>
              <Avatar name={displayName} size="sm" />
            </div>

            <div className="mb-7 mt-8 flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0">
                {kicker && (
                  <p className="mb-1.5 inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[var(--gold)]">
                    <span aria-hidden className="h-px w-6 bg-gradient-to-r from-[var(--gold)] to-transparent" />
                    {kicker}
                  </p>
                )}
                <h1 className="gradient-text font-display text-[28px] font-extrabold leading-tight tracking-tight sm:text-[36px]">
                  {title}
                </h1>
                {subtitle && <p className="mt-1.5 text-sm text-[var(--subtle)]">{subtitle}</p>}
              </div>
              {actions && <div className="flex flex-none items-center gap-2">{actions}</div>}
            </div>
            <div className="app-enter">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg className="h-4 w-4 flex-none text-[var(--subtle)]" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <circle cx="9" cy="9" r="5.5" />
      <path d="M13.5 13.5L17 17" strokeLinecap="round" />
    </svg>
  );
}

function NavIcon({ href }: { href: string }) {
  const cls = "adm-nav-icon h-[18px] w-[18px] shrink-0";

  if (href === "/admin" || href === "/dashboard")
    return (
      <svg className={cls} viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 11l8-8 8 8v7a1 1 0 01-1 1H3a1 1 0 01-1-1v-7z" />
      </svg>
    );
  if (href === "/admin/verifications")
    return (
      <svg className={cls} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
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
  if (href === "/admin/payouts")
    return (
      <svg className={cls} viewBox="0 0 20 20" fill="currentColor">
        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
      </svg>
    );
  if (href === "/admin/disputes")
    return (
      <svg className={cls} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    );
  if (href === "/admin/plans")
    return (
      <svg className={cls} viewBox="0 0 20 20" fill="currentColor">
        <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zm-5.447.894A1 1 0 004 17v-5.764a1 1 0 01.553-.894l4-2A1 1 0 0110 9.236V15a1 1 0 01-.553.894l-4 2zM15 5a3 3 0 11-6 0 3 3 0 016 0zM7 8a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    );
  if (href === "/admin/messages")
    return (
      <svg className={cls} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.84 8.84 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
      </svg>
    );
  // fallback
  return (
    <svg className={cls} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
    </svg>
  );
}

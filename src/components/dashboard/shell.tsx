"use client";

import { NotificationBell } from "@/components/dashboard/notification-bell";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { createClient } from "@/lib/supabase/client";
import { setPreferredLocale } from "@/app/(fr)/dashboard/compte/actions";

export type NavItem = {
  href: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
  current?: boolean;
};

export type NavSection = { title: string; items: NavItem[] };

// ─── Icons ─────────────────────────────────────────────────────────────────

function IcHome() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5Z"/><path d="M9 21V12h6v9"/></svg>;
}
function IcOrders() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="m9 12 2 2 4-4"/></svg>;
}
function IcMessage() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
}
function IcBell() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
}
function IcHeart() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
}
function IcBriefcase() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>;
}
function IcWallet() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"/><circle cx="17" cy="13" r="1" fill="currentColor" stroke="none"/><path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"/></svg>;
}
function IcStar() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
}
function IcRocket() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>;
}
function IcUser() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>;
}
function IcShield() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>;
}
function IcSettings() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
}
function IcSearch() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
}
function IcDispute() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0ZM12 9v4M12 17h.01"/></svg>;
}
function IcMenu() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>;
}
function IcX() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>;
}
function IcOut() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}

export const NAV_ICONS: Record<string, React.ReactNode> = {
  home: <IcHome />, briefcase: <IcBriefcase />, orders: <IcOrders />,
  message: <IcMessage />, wallet: <IcWallet />, shield: <IcShield />,
  search: <IcSearch />, admin: <IcShield />,
};

// Map href → icon (for sections that don't pass icons)
const HREF_ICONS: Record<string, React.ReactNode> = {
  "/dashboard": <IcHome />,
  "/orders": <IcOrders />,
  "/messages": <IcMessage />,
  "/demandes": <IcBell />,
  "/disputes": <IcDispute />,
  "/notifications": <IcBell />,
  "/dashboard/favoris": <IcHeart />,
  "/dashboard/prestations": <IcBriefcase />,
  "/dashboard/versements": <IcWallet />,
  "/dashboard/plan": <IcStar />,
  "/dashboard/boost": <IcRocket />,
  "/dashboard/profil": <IcUser />,
  "/dashboard/verification": <IcShield />,
  "/dashboard/compte": <IcSettings />,
  "/services": <IcSearch />,
};

// ─── NavLink ────────────────────────────────────────────────────────────────

function NavLink({ item, pathname, onClose }: { item: NavItem; pathname: string; onClose: () => void }) {
  const active = item.current ?? pathname === item.href;
  const icon = item.icon ?? HREF_ICONS[item.href];
  return (
    <li>
      <Link
        href={item.href}
        onClick={onClose}
        className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-150 ${
          active
            ? "bg-[var(--color-brand-50)] text-[var(--color-brand-700)]"
            : "text-[var(--subtle)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
        }`}
      >
        {/* Left accent bar */}
        {active && (
          <span
            aria-hidden
            className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--color-brand-500)]"
          />
        )}
        {icon && (
          <span className={`shrink-0 transition-colors ${active ? "text-[var(--color-brand-500)]" : "text-[var(--subtle)] group-hover:text-[var(--foreground)]"}`}>
            {icon}
          </span>
        )}
        <span className="flex-1 truncate">{item.label}</span>
        {item.badge !== undefined && item.badge > 0 && (
          <span className="rounded-full bg-[var(--color-brand-500)] px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
            {item.badge}
          </span>
        )}
      </Link>
    </li>
  );
}

// ─── Shell ──────────────────────────────────────────────────────────────────

export function DashboardShell({
  user,
  nav = [],
  navSections,
  title,
  kicker,
  subtitle,
  actions,
  children,
  locale = "fr",
}: {
  user: {
    displayName: string | null;
    email: string | null;
    role: string;
    verificationStatus?: string;
    firstName?: string | null;
    lastName?: string | null;
  };
  nav?: NavItem[];
  navSections?: NavSection[];
  title: string;
  kicker?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  locale?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const [signingOut, setSigningOut] = useState(false);
  const otherLocale = locale === "en" ? "fr" : "en";
  const otherPath = locale === "en" ? "/dashboard" : "/en/dashboard";

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  async function handleLocaleSwitch() {
    if (switching) return;
    setSwitching(true);
    try {
      await setPreferredLocale(otherLocale as "fr" | "en");
      router.push(otherPath);
      router.refresh();
    } finally {
      setSwitching(false);
    }
  }

  const initials = (user.displayName ?? user.email ?? "?")
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  const roleLabel: Record<string, string> = {
    client: "Recruteur",
    provider: "Prestataire",
    both: "Prestataire · Recruteur",
    admin: "Administrateur",
  };

  const kycVerified = user.verificationStatus === "verified";
  const kycPending = user.verificationStatus === "pending" || user.verificationStatus === "manual_review";

  function SidebarContent() {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        {/* Logo area + sign out top-right */}
        <div className="relative flex h-[60px] shrink-0 items-center justify-between px-4">
          <Link href="/" onClick={() => setSidebarOpen(false)} className="text-[var(--color-brand-500)]">
            <Logo size={26} />
          </Link>
          <div className="flex items-center gap-1">
            <NotificationBell locale={locale === "en" ? "en" : "fr"} />
          {/* Sign out — icône en haut à droite */}
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            title="Se déconnecter"
            aria-label="Se déconnecter"
            className="rounded-lg p-1.5 text-[var(--subtle)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)] disabled:opacity-50"
          >
            {signingOut
              ? <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 0 0-9-9" strokeLinecap="round"/></svg>
              : <IcOut />
            }
          </button>
          </div>
          {/* Thin brand line at bottom */}
          <div className="absolute bottom-0 inset-x-4 h-px bg-gradient-to-r from-[var(--color-brand-200)] via-[var(--color-brand-100)] to-transparent" />
        </div>

        {/* User card */}
        <div className="mx-3 mt-3 mb-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
          <div className="flex items-center gap-3">
            {/* Avatar with brand gradient */}
            <div className="relative shrink-0">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl font-display text-sm font-bold text-white shadow-md"
                style={{ background: "linear-gradient(135deg, var(--color-brand-500) 0%, var(--color-brand-700) 100%)" }}
              >
                {initials}
              </div>
              {kycVerified && (
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-brand-500)] text-white ring-2 ring-[var(--background)]">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 13 4 4L19 7"/></svg>
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold leading-tight">{user.displayName ?? user.email?.split("@")[0]}</p>
              <p className="mt-0.5 truncate text-[11px] text-[var(--subtle)]">{user.email}</p>
            </div>
          </div>

          {/* Role + KYC pill */}
          <div className="mt-2.5 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand-50)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--color-brand-700)]">
              {roleLabel[user.role] ?? user.role}
            </span>
            {(user.role === "provider" || user.role === "both") && (
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                kycVerified ? "bg-emerald-50 text-emerald-700" : kycPending ? "bg-sky-50 text-sky-700" : "bg-amber-50 text-amber-700"
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${kycVerified ? "bg-emerald-500" : kycPending ? "bg-sky-500 animate-pulse" : "bg-amber-400"}`} />
                {kycVerified ? "Vérifié" : kycPending ? "En cours" : "Non vérifié"}
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label="Navigation principale">
          {navSections ? (
            <div className="space-y-4">
              {navSections.map((section) => (
                <div key={section.title}>
                  <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--subtle)]">
                    {section.title}
                  </p>
                  <ul className="space-y-0.5">
                    {section.items.map((item) => (
                      <NavLink key={item.href} item={item} pathname={pathname} onClose={() => setSidebarOpen(false)} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <ul className="space-y-0.5">
              {nav.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} onClose={() => setSidebarOpen(false)} />
              ))}
            </ul>
          )}
        </nav>

        {/* Locale switcher */}
        <div className="shrink-0 border-t border-[var(--border)] px-3 py-3">
          <button
            onClick={handleLocaleSwitch}
            disabled={switching}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-[var(--subtle)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)] disabled:opacity-50"
          >
            <span aria-hidden className="text-base leading-none">
              {locale === "en" ? "🇫🇷" : "🇬🇧"}
            </span>
            <span>{locale === "en" ? "Passer en français" : "Switch to English"}</span>
            {switching && (
              <svg className="ml-auto animate-spin text-[var(--subtle)]" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 0 0-9-9" strokeLinecap="round"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh bg-[var(--surface)]">
      {/* Sidebar desktop */}
      <aside className="hidden w-[220px] shrink-0 border-r border-[var(--border)] bg-[var(--background)] lg:fixed lg:inset-y-0 lg:flex lg:flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[220px] border-r border-[var(--border)] bg-[var(--background)] shadow-2xl transition-transform duration-300 lg:hidden ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex min-h-dvh w-full flex-col lg:pl-[220px]">
        {/* Mobile topbar */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--background)] px-4 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 text-[var(--subtle)] hover:bg-[var(--surface)]" aria-label="Menu">
            {sidebarOpen ? <IcX /> : <IcMenu />}
          </button>
          <Link href="/" className="text-[var(--color-brand-500)]"><Logo size={22} /></Link>
          <div className="flex items-center gap-2">
            <NotificationBell locale={locale === "en" ? "en" : "fr"} />
            <button
              onClick={handleLocaleSwitch}
              disabled={switching}
              title={locale === "en" ? "Passer en français" : "Switch to English"}
              className="flex items-center gap-1 rounded-full border border-[var(--border)] px-2.5 py-1 text-[11px] font-semibold text-[var(--subtle)] transition-colors hover:border-[var(--color-brand-300)] hover:text-[var(--foreground)] disabled:opacity-50"
            >
              <span aria-hidden>{locale === "en" ? "🇫🇷" : "🇬🇧"}</span>
              <span className="uppercase tracking-wide">{otherLocale}</span>
            </button>
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg font-display text-xs font-bold text-white shadow"
              style={{ background: "linear-gradient(135deg, var(--color-brand-500) 0%, var(--color-brand-700) 100%)" }}
            >
              {initials}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {/* Page header */}
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              {kicker && (
                <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-brand-600)]">
                  {kicker}
                </p>
              )}
              <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-[var(--subtle)]">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-3">{actions}</div>}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

// ─── StatCard ───────────────────────────────────────────────────────────────

export function StatCard({
  label,
  value,
  hint,
  icon,
  accent = false,
  trend,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
  accent?: boolean;
  trend?: { value: string; up: boolean };
}) {
  if (accent) {
    return (
      <div className="relative overflow-hidden rounded-2xl p-5 text-white shadow-lg shadow-[var(--color-brand-500)]/20"
        style={{ background: "linear-gradient(135deg, var(--color-brand-600) 0%, var(--color-brand-800) 100%)" }}
      >
        {/* Decorative circle */}
        <div aria-hidden className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
        <div aria-hidden className="pointer-events-none absolute -bottom-8 -right-2 h-24 w-24 rounded-full bg-white/5" />
        <div className="relative flex items-start justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70">{label}</p>
          {icon && <span className="text-white/60">{icon}</span>}
        </div>
        <p className="relative mt-3 font-display text-2xl font-extrabold tracking-tight">{value}</p>
        <div className="relative mt-1.5 flex items-center justify-between gap-2">
          {hint && <p className="text-xs text-white/65">{hint}</p>}
          {trend && (
            <span className={`flex items-center gap-0.5 text-xs font-semibold ${trend.up ? "text-emerald-300" : "text-red-300"}`}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                {trend.up ? <path d="M12 5l7 7H5l7-7Z" /> : <path d="M12 19l7-7H5l7 7Z" />}
              </svg>
              {trend.value}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--subtle)]">{label}</p>
        {icon && <span className="text-[var(--subtle)]">{icon}</span>}
      </div>
      <p className="mt-3 font-display text-2xl font-extrabold tracking-tight">{value}</p>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        {hint && <p className="text-xs text-[var(--subtle)]">{hint}</p>}
        {trend && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold ${trend.up ? "text-[var(--color-brand-600)]" : "text-red-500"}`}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
              {trend.up ? <path d="M12 5l7 7H5l7-7Z" /> : <path d="M12 19l7-7H5l7 7Z" />}
            </svg>
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── EmptyState ─────────────────────────────────────────────────────────────

export function EmptyState({
  title,
  body,
  action,
  icon,
}: {
  title: string;
  body: string;
  action?: { href: string; label: string };
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background)] px-6 py-14 text-center">
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface)] text-[var(--subtle)]">
          {icon}
        </div>
      )}
      <h3 className="font-display text-base font-bold">{title}</h3>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-[var(--subtle)]">{body}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--color-brand-500)] px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-[var(--color-brand-500)]/30 transition-all hover:scale-[1.03] hover:bg-[var(--color-brand-600)] active:scale-95"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

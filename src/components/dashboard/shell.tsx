"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { SignOutButton } from "./sign-out";

export type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  current?: boolean;
};

// ─── Icons ─────────────────────────────────────────────────────────────────

function IcHome() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5Z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}
function IcBriefcase() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  );
}
function IcOrders() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  );
}
function IcMessage() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function IcWallet() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" />
      <path d="M16 13a1 1 0 1 0 2 0 1 1 0 0 0-2 0Z" fill="currentColor" stroke="none" />
      <path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
function IcShield() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
function IcSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}
function IcAdmin() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z" />
      <path d="M12 8v4l3 3" />
    </svg>
  );
}
function IcMenu() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}
function IcX() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

// ─── Nav icons map ──────────────────────────────────────────────────────────

export const NAV_ICONS: Record<string, React.ReactNode> = {
  home: <IcHome />,
  briefcase: <IcBriefcase />,
  orders: <IcOrders />,
  message: <IcMessage />,
  wallet: <IcWallet />,
  shield: <IcShield />,
  search: <IcSearch />,
  admin: <IcAdmin />,
};

// ─── Shell ──────────────────────────────────────────────────────────────────

export function DashboardShell({
  user,
  nav,
  title,
  subtitle,
  actions,
  children,
}: {
  user: {
    displayName: string | null;
    email: string | null;
    role: string;
    verificationStatus?: string;
    firstName?: string | null;
    lastName?: string | null;
  };
  nav: NavItem[];
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center border-b border-[var(--border)] px-5">
          <Link href="/" onClick={() => setSidebarOpen(false)} className="text-[var(--color-brand-500)]">
            <Logo size={26} />
          </Link>
        </div>

        {/* User card */}
        <div className="border-b border-[var(--border)] px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-100)] font-display text-sm font-bold text-[var(--color-brand-700)]">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user.displayName ?? user.email}</p>
              <p className="text-xs text-[var(--subtle)]">{roleLabel[user.role] ?? user.role}</p>
            </div>
          </div>

          {/* KYC badge — prestataires seulement */}
          {(user.role === "provider" || user.role === "both") && (
            <div className={`mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium ${
              kycVerified
                ? "bg-[var(--color-brand-50)] text-[var(--color-brand-700)]"
                : kycPending
                  ? "bg-blue-50 text-blue-700"
                  : "bg-amber-50 text-amber-700"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${kycVerified ? "bg-[var(--color-brand-500)]" : kycPending ? "bg-blue-500" : "bg-amber-400"}`} />
              {kycVerified ? "Identité vérifiée" : kycPending ? "Vérification en cours" : "Vérification requise"}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {nav.map((item) => {
            const active = item.current ?? pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[var(--color-brand-50)] text-[var(--color-brand-700)]"
                    : "text-[var(--subtle)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
                }`}
              >
                <span className={active ? "text-[var(--color-brand-500)]" : "text-[var(--subtle)] group-hover:text-[var(--foreground)]"}>
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="rounded-full bg-[var(--color-brand-500)] px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="shrink-0 border-t border-[var(--border)] px-5 py-4">
          <SignOutButton />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh bg-[var(--surface)]">
      {/* Sidebar desktop — fixed */}
      <aside className="hidden w-64 shrink-0 border-r border-[var(--border)] bg-[var(--background)] lg:fixed lg:inset-y-0 lg:flex lg:flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-[var(--border)] bg-[var(--background)] transition-transform duration-300 lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Main area */}
      <div className="flex min-h-dvh w-full flex-col lg:pl-64">
        {/* Mobile top bar */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--background)] px-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-[var(--subtle)] hover:bg-[var(--surface)]"
          >
            {sidebarOpen ? <IcX /> : <IcMenu />}
          </button>
          <Link href="/" className="text-[var(--color-brand-500)]">
            <Logo size={24} />
          </Link>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-brand-100)] font-display text-xs font-bold text-[var(--color-brand-700)]">
            {initials}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {/* Page header */}
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold sm:text-3xl">{title}</h1>
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
  return (
    <div className={`rounded-2xl border p-5 ${accent ? "border-[var(--color-brand-200)] bg-[var(--color-brand-50)]" : "border-[var(--border)] bg-[var(--background)]"}`}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--subtle)]">{label}</p>
        {icon && (
          <span className={`${accent ? "text-[var(--color-brand-500)]" : "text-[var(--subtle)]"}`}>
            {icon}
          </span>
        )}
      </div>
      <p className={`mt-3 font-display text-2xl font-bold tracking-tight ${accent ? "text-[var(--color-brand-700)]" : ""}`}>
        {value}
      </p>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        {hint && <p className="text-xs text-[var(--subtle)]">{hint}</p>}
        {trend && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${trend.up ? "text-[var(--color-brand-600)]" : "text-red-500"}`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              {trend.up
                ? <path d="M12 5l7 7H5l7-7Z" />
                : <path d="M12 19l7-7H5l7 7Z" />}
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
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--subtle)]">
          {icon}
        </div>
      )}
      <h3 className="font-display text-base font-bold">{title}</h3>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-[var(--subtle)]">{body}</p>
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

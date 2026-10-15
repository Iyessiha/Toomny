"use client";

import Link from "next/link";
import { useEffect, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { getLanding } from "@/content/landing";
import { createClient } from "@/lib/supabase/client";
import type { Locale } from "@/i18n/dictionaries";
import type { User } from "@supabase/supabase-js";
import { setPreferredLocale } from "@/app/(fr)/dashboard/compte/actions";

export function Header({ locale = "fr" }: { locale?: Locale }) {
  const t = getLanding(locale).nav;
  const home = locale === "en" ? "/en" : "/";
  const other = locale === "en" ? "/" : "/en";
  const authPath = locale === "en" ? "/en/auth" : "/auth";
  const router = useRouter();

  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setSigningOut(false);
    router.push("/");
    router.refresh();
  }

  async function handleLocaleSwitch(e: MouseEvent<HTMLAnchorElement>) {
    setOpen(false);
    if (!user) return; // visiteur : le proxy synchronise le cookie
    e.preventDefault();
    await setPreferredLocale(locale === "en" ? "fr" : "en");
    router.push(other);
    router.refresh();
  }

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : "??";

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "border-b border-[var(--border)] bg-[var(--background)]/85 backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link href={home} className="text-[var(--color-brand-500)]" aria-label={t.home}>
          <Logo size={30} />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 text-sm lg:flex">
          {t.links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[var(--subtle)] transition-colors hover:text-[var(--foreground)]"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href={other}
            hrefLang={locale === "en" ? "fr" : "en"}
            onClick={handleLocaleSwitch}
            title={locale === "en" ? "Passer en français" : "Switch to English"}
            className="flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1.5 text-sm font-semibold text-[var(--subtle)] transition-colors hover:border-[var(--color-brand-400)] hover:text-[var(--foreground)]"
          >
            <span aria-hidden>{locale === "en" ? "🇫🇷" : "🇬🇧"}</span>
            <span className="text-xs uppercase tracking-wide">{locale === "en" ? "FR" : "EN"}</span>
          </Link>

          {user ? (
            <>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1.5 text-sm font-medium transition-colors hover:border-[var(--color-brand-400)] hover:text-[var(--color-brand-600)]"
              >
                <span
                  aria-hidden
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-brand-100)] text-[10px] font-bold text-[var(--color-brand-700)]"
                >
                  {initials}
                </span>
                {locale === "en" ? "My space" : "Mon espace"}
              </Link>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="rounded-full px-4 py-2 text-sm font-medium text-[var(--subtle)] transition-colors hover:text-[var(--foreground)] disabled:opacity-50"
              >
                {signingOut
                  ? "…"
                  : locale === "en"
                    ? "Log out"
                    : "Déconnexion"}
              </button>
            </>
          ) : (
            <>
              <Link
                href={authPath}
                className="rounded-full px-4 py-2 text-sm font-medium text-[var(--subtle)] transition-colors hover:text-[var(--foreground)]"
              >
                {t.login}
              </Link>
              <Link
                href={authPath}
                className="rounded-full bg-[var(--color-brand-500)] px-5 py-2.5 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.03] active:scale-95"
              >
                {t.signup}
              </Link>
            </>
          )}
        </div>

        {/* Mobile/tablet burger */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={t.menu}
          className="lg:hidden"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M18 6 6 18M6 6l12 12" />
            ) : (
              <path d="M3 7h18M3 12h18M3 17h18" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile/tablet menu */}
      {open && (
        <div className="border-t border-[var(--border)] bg-[var(--background)] px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {t.links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2.5 text-sm text-[var(--subtle)] hover:text-[var(--foreground)]"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href={other}
              onClick={handleLocaleSwitch}
              className="flex items-center gap-2 rounded-lg px-2 py-2.5 text-sm text-[var(--subtle)] hover:text-[var(--foreground)]"
            >
              <span aria-hidden>{locale === "en" ? "🇫🇷" : "🇬🇧"}</span>
              {locale === "en" ? "Français" : "English"}
            </Link>

            {user ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="mt-2 flex items-center gap-2 rounded-full border border-[var(--border)] px-5 py-3 text-center text-sm font-semibold"
                >
                  <span
                    aria-hidden
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-brand-100)] text-[10px] font-bold text-[var(--color-brand-700)]"
                  >
                    {initials}
                  </span>
                  {locale === "en" ? "My space" : "Mon espace"}
                </Link>
                <button
                  onClick={() => { setOpen(false); handleSignOut(); }}
                  className="mt-1 rounded-full border border-[var(--border)] px-5 py-3 text-sm text-[var(--subtle)]"
                >
                  {locale === "en" ? "Log out" : "Déconnexion"}
                </button>
              </>
            ) : (
              <Link
                href={authPath}
                onClick={() => setOpen(false)}
                className="mt-2 rounded-full bg-[var(--color-brand-500)] px-5 py-3 text-center text-sm font-semibold text-white"
              >
                {t.signup}
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

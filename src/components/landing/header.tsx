"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/logo";

const LINKS = [
  { href: "#categories", label: "Catégories" },
  { href: "#fonctionnement", label: "Comment ça marche" },
  { href: "#tarifs", label: "Tarifs" },
  { href: "#securite", label: "Sécurité" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "border-b border-[var(--border)] bg-[var(--background)]/85 backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link href="/" className="text-[var(--color-brand-500)]" aria-label="Toomny — accueil">
          <Logo size={30} />
        </Link>

        <nav className="hidden items-center gap-7 text-sm lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[var(--subtle)] transition-colors hover:text-[var(--foreground)]"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          <Link
            href="/auth"
            className="rounded-full px-4 py-2 text-sm font-medium text-[var(--subtle)] transition-colors hover:text-[var(--foreground)]"
          >
            Se connecter
          </Link>
          <Link
            href="/auth"
            className="rounded-full bg-[var(--color-brand-500)] px-5 py-2.5 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.03] active:scale-95"
          >
            Créer un compte
          </Link>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Menu"
          className="sm:hidden"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M3 7h18M3 12h18M3 17h18" />}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-[var(--border)] bg-[var(--background)] px-4 py-4 sm:hidden">
          <nav className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2.5 text-sm text-[var(--subtle)]"
              >
                {l.label}
              </a>
            ))}
            <Link
              href="/auth"
              className="mt-2 rounded-full bg-[var(--color-brand-500)] px-5 py-3 text-center text-sm font-semibold text-white"
            >
              Créer un compte
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

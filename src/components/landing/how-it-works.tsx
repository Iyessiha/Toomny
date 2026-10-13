"use client";

import { useState, useEffect, useRef } from "react";
import { getLanding } from "@/content/landing";
import type { Locale } from "@/i18n/dictionaries";

type Key = "client" | "provider";

const CLIENT_ICONS = [
  // Rechercher / catalogue
  <svg key="c1" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>,
  // Paiement sécurisé
  <svg key="c2" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/>
  </svg>,
  // Valider
  <svg key="c3" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12l2 2 4-4"/><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10Z"/>
  </svg>,
];

const PROVIDER_ICONS = [
  // Publier
  <svg key="p1" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"/>
  </svg>,
  // Travailler serein
  <svg key="p2" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>
  </svg>,
  // Recevoir sur Wave
  <svg key="p3" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect width="7" height="12" x="2" y="7" rx="1"/><path d="M16 6v12M11 9v6M21 8v8"/>
  </svg>,
];

const STEP_COLORS = [
  { bg: "bg-[var(--color-brand-50)]", text: "text-[var(--color-brand-600)]", num: "text-[var(--color-brand-100)]", numHover: "group-hover:text-[var(--color-brand-200)]", border: "hover:border-[var(--color-brand-300)]" },
  { bg: "bg-violet-50", text: "text-violet-600", num: "text-violet-100", numHover: "group-hover:text-violet-200", border: "hover:border-violet-300" },
  { bg: "bg-emerald-50", text: "text-emerald-600", num: "text-emerald-100", numHover: "group-hover:text-emerald-200", border: "hover:border-emerald-300" },
];

export function HowItWorks({ locale = "fr" }: { locale?: Locale }) {
  const t = getLanding(locale).how;
  const [key, setKey] = useState<Key>("client");
  const steps = t[key];
  const icons = key === "client" ? CLIENT_ICONS : PROVIDER_ICONS;
  const olRef = useRef<HTMLOListElement>(null);

  // Quand on change d'onglet, les nouveaux <li data-reveal> ne sont pas observés
  // par l'IntersectionObserver global → on les révèle manuellement.
  useEffect(() => {
    const timer = setTimeout(() => {
      olRef.current?.querySelectorAll("[data-reveal]").forEach((el) => {
        el.classList.add("is-revealed");
      });
    }, 10);
    return () => clearTimeout(timer);
  }, [key]);

  return (
    <section id="fonctionnement" className="border-t border-[var(--border)]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div data-reveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-brand-600)]">
              {t.eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">{t.title}</h2>
          </div>

          <div className="inline-flex shrink-0 rounded-full border border-[var(--border)] bg-[var(--background)] p-1 text-sm">
            {(["client", "provider"] as Key[]).map((k) => (
              <button
                key={k}
                onClick={() => setKey(k)}
                aria-pressed={key === k}
                className={`rounded-full px-5 py-2 font-medium transition-colors duration-200 ${
                  key === k ? "bg-[var(--color-brand-500)] text-white" : "text-[var(--subtle)] hover:text-[var(--foreground)]"
                }`}
              >
                {t.tabs[k]}
              </button>
            ))}
          </div>
        </div>

        <ol ref={olRef} className="mt-14 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {steps.map((s, i) => {
            const c = STEP_COLORS[i];
            return (
              <li
                key={s.title}
                data-reveal
                style={{ transitionDelay: `${i * 80}ms` }}
                className={`group relative rounded-2xl border border-[var(--border)] bg-[var(--background)] p-7 transition-all duration-300 ${c.border}`}
              >
                {/* Numéro décoratif */}
                <span
                  className={`absolute right-6 top-5 font-display text-5xl font-extrabold transition-colors duration-300 ${c.num} ${c.numHover}`}
                  aria-hidden
                >
                  {String(i + 1).padStart(2, "0")}
                </span>

                {/* Icône fonctionnelle */}
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${c.bg} ${c.text}`}>
                  {icons[i]}
                </div>

                <h3 className="mt-5 text-base font-bold leading-tight">{s.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[var(--subtle)]">{s.body}</p>

                {/* Connecteur entre les étapes (desktop) */}
                {i < 2 && (
                  <div className="pointer-events-none absolute -right-4 top-1/2 hidden -translate-y-1/2 md:block" aria-hidden>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M5 12h14M13 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

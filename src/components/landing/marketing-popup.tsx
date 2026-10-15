"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import type { Locale } from "@/i18n/dictionaries";

type PopupVariant = "exit" | "timed" | null;

const SEEN_KEY = "toomny_popup_seen";
const TIMED_DELAY_MS = 20_000; // 20 secondes
const EXIT_MIN_TIME_MS = 8_000; // 8 s minimum avant exit intent

const CONTENT = {
  exit: {
    fr: {
      eyebrow: "Avant de partir…",
      title: "Vos projets méritent les meilleurs talents africains",
      lead: "Identité visuelle, développement web, marketing digital. Des experts vérifiés, payés en mobile money. Commission 0 % côté client.",
      primaryCta: "Voir les prestataires",
      primaryHref: "/services",
      secondaryCta: "Je propose mes services",
      secondaryHref: "/auth?role=provider",
    },
    en: {
      eyebrow: "Before you go…",
      title: "Your projects deserve the best African talent",
      lead: "Visual identity, web development, digital marketing. Verified experts, paid via mobile money. Zero client fee.",
      primaryCta: "Browse providers",
      primaryHref: "/services",
      secondaryCta: "I offer my services",
      secondaryHref: "/auth?role=provider",
    },
  },
  timed: {
    fr: {
      eyebrow: "Rejoignez Toomny",
      title: "Trouvez un talent en 5 minutes — ou vendez vos services dès aujourd'hui",
      lead: "Paiement conservé jusqu'à livraison. Auto-validation 72 h. Sans société américaine, sans Payoneer.",
      primaryCta: "Créer un compte gratuit",
      primaryHref: "/auth",
      secondaryCta: "Explorer le catalogue",
      secondaryHref: "/services",
    },
    en: {
      eyebrow: "Join Toomny",
      title: "Find talent in 5 minutes — or sell your services starting today",
      lead: "Payment held until delivery. 72-hour auto-release. No US company, no Payoneer.",
      primaryCta: "Create a free account",
      primaryHref: "/auth",
      secondaryCta: "Browse the catalogue",
      secondaryHref: "/services",
    },
  },
};

// Perks rapides affichés dans le popup
const PERKS = {
  fr: ["0 % commission côté client", "Paiement sécurisé jusqu'à livraison", "Versement Wave · Orange · MTN"],
  en: ["0% client commission", "Secure payment until delivery", "Wave · Orange · MTN payout"],
};

function detectLocale(fallback: Locale): Locale {
  if (typeof navigator === "undefined") return fallback;
  return navigator.language?.toLowerCase().startsWith("fr") ? "fr" : "en";
}

export function MarketingPopup({ locale = "fr" }: { locale?: Locale }) {
  const [variant, setVariant] = useState<PopupVariant>(null);
  const [visible, setVisible] = useState(false);
  // Langue basée sur le navigateur du visiteur (pas seulement la route)
  const [effectiveLocale, setEffectiveLocale] = useState<Locale>(locale);
  const shownRef = useRef(false);
  const entryTimeRef = useRef(Date.now());

  useEffect(() => {
    setEffectiveLocale(detectLocale(locale));
  }, [locale]);

  const show = useCallback((v: PopupVariant) => {
    if (shownRef.current || !v) return;
    shownRef.current = true;
    try { sessionStorage.setItem(SEEN_KEY, "1"); } catch { /* noop */ }
    setVariant(v);
    // Petit délai pour l'animation CSS
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => setVariant(null), 350);
  }, []);

  useEffect(() => {
    // Ne pas afficher si déjà vu dans cette session
    try { if (sessionStorage.getItem(SEEN_KEY)) return; } catch { /* noop */ }

    // Popup chronométrique — 20 s
    const timedTimer = setTimeout(() => show("timed"), TIMED_DELAY_MS);

    // Exit intent — souris quitte vers le haut
    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY > 10) return;
      if (Date.now() - entryTimeRef.current < EXIT_MIN_TIME_MS) return;
      clearTimeout(timedTimer);
      show("exit");
    };
    document.addEventListener("mouseleave", onMouseLeave);

    // Escape pour fermer
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") dismiss(); };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      clearTimeout(timedTimer);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [show, dismiss]);

  if (!variant) return null;

  const c = CONTENT[variant][effectiveLocale];
  const perks = PERKS[effectiveLocale];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={dismiss}
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
        aria-hidden
      />

      {/* Modal — centrage via inset-x-0 + mx-auto (pas de translateX → compatible mobile) */}
      <div
        role="dialog"
        aria-modal
        aria-label={c.title}
        className="fixed inset-x-4 bottom-4 z-[101] mx-auto max-w-lg rounded-3xl border border-[var(--border)] bg-[var(--background)] shadow-2xl shadow-black/40 sm:inset-x-0 sm:bottom-8"
        style={{
          transition: "transform 0.3s ease, opacity 0.3s ease",
          transform: visible ? "translateY(0) scale(1)" : "translateY(24px) scale(0.97)",
          opacity: visible ? 1 : 0,
        }}
      >
        {/* Halo de marque en haut */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-48 overflow-hidden rounded-t-3xl"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(34,197,94,0.12) 0%, transparent 70%)",
          }}
        />

        <div className="relative p-6 sm:p-8">
          {/* Fermer */}
          <button
            onClick={dismiss}
            aria-label="Fermer"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[var(--subtle)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M1 1l12 12M13 1 1 13" />
            </svg>
          </button>

          {/* Eyebrow */}
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-brand-600)]">
            {c.eyebrow}
          </p>

          {/* Titre */}
          <h2 className="mt-2 text-xl font-extrabold leading-tight sm:text-2xl">
            {c.title}
          </h2>

          {/* Lead */}
          <p className="mt-3 text-sm leading-relaxed text-[var(--subtle)]">
            {c.lead}
          </p>

          {/* Perks rapides */}
          <ul className="mt-4 flex flex-col gap-1.5">
            {perks.map((perk) => (
              <li key={perk} className="flex items-center gap-2 text-xs font-medium text-[var(--foreground)]">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" className="shrink-0 text-[var(--color-brand-500)]" aria-hidden>
                  <path d="M11.854 3.646a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L5.5 9.293l5.646-5.647a.5.5 0 0 1 .708 0Z" />
                </svg>
                {perk}
              </li>
            ))}
          </ul>

          {/* CTAs */}
          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <Link
              href={c.primaryHref}
              onClick={dismiss}
              className="flex-1 rounded-full bg-[var(--color-brand-500)] px-5 py-3 text-center text-sm font-semibold text-white shadow-[0_4px_16px_rgba(16,128,67,0.3)] transition-all hover:bg-[var(--color-brand-600)] hover:-translate-y-px active:scale-95"
            >
              {c.primaryCta}
            </Link>
            <Link
              href={c.secondaryHref}
              onClick={dismiss}
              className="flex-1 rounded-full border border-[var(--color-brand-300)] px-5 py-3 text-center text-sm font-semibold text-[var(--color-brand-600)] transition-colors hover:bg-[var(--color-brand-50)]"
            >
              {c.secondaryCta}
            </Link>
          </div>

          {/* Note légère */}
          <p className="mt-4 text-center text-[10px] text-[var(--subtle)]">
            {effectiveLocale === "fr" ? "Inscription gratuite · Pas de carte bancaire requise" : "Free signup · No credit card required"}
          </p>
        </div>
      </div>
    </>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { HeroVisual } from "./hero-visual";

/**
 * Double audience dès le premier écran : c'est la structure retenue par les
 * marketplaces régionales qui fonctionnent (Workana en Amérique latine). Un
 * visiteur doit savoir en une seconde laquelle des deux promesses le concerne.
 */
const AUDIENCES = {
  client: {
    label: "Je cherche un prestataire",
    title: ["Recrutez les meilleurs", "talents d'Afrique de l'Ouest"],
    lead: "Payez en FCFA par mobile money. Votre argent reste bloqué jusqu'à la livraison. Des prestataires vérifiés, dans votre langue et votre fuseau horaire.",
    cta: "Trouver un prestataire",
    href: "/services",
    points: ["0 % de frais côté client", "Fonds bloqués jusqu'à validation", "Litige arbitré en français"],
  },
  provider: {
    label: "Je propose mes services",
    title: ["Vendez vos services,", "soyez payé chez vous"],
    lead: "Vous gardez 90 % de ce que vous facturez, versé sous 24 h sur votre Wave ou votre Orange Money. Sans société américaine, sans Payoneer.",
    cta: "Proposer mes services",
    href: "/auth",
    points: ["10 % de commission, c'est tout", "Versé sous 24 h en mobile money", "Candidature gratuite"],
  },
} as const;

type Key = keyof typeof AUDIENCES;

const RAILS = ["Wave", "Orange Money", "MTN MoMo", "Moov Money"];

export function Hero() {
  const [key, setKey] = useState<Key>("client");
  const a = AUDIENCES[key];

  return (
    <section className="relative overflow-hidden">
      {/* Halo de marque : un seul dégradé radial, aucune image à télécharger. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 h-[520px] opacity-[0.55]"
        style={{
          background:
            "radial-gradient(60% 55% at 50% 40%, var(--color-brand-200) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto grid max-w-6xl gap-16 px-4 pb-12 pt-14 sm:px-6 sm:pb-16 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12">
        <div>
        {/* Sélecteur d'audience */}
        <div
          data-reveal
          className="inline-flex rounded-full border border-[var(--border)] bg-[var(--background)] p-1 text-sm shadow-sm"
          role="tablist"
        >
          {(Object.keys(AUDIENCES) as Key[]).map((k) => (
            <button
              key={k}
              role="tab"
              aria-selected={key === k}
              onClick={() => setKey(k)}
              className={`rounded-full px-4 py-2 font-medium transition-colors duration-200 ${
                key === k
                  ? "bg-[var(--color-brand-500)] text-white"
                  : "text-[var(--subtle)] hover:text-[var(--foreground)]"
              }`}
            >
              {AUDIENCES[k].label}
            </button>
          ))}
        </div>

        <h1
          data-reveal
          style={{ transitionDelay: "50ms" }}
          className="mt-8 text-[2.5rem] font-extrabold leading-[1.05] text-balance sm:text-[3.3rem] lg:text-[3.25rem] xl:text-[3.6rem]"
        >
          {a.title[0]}{" "}
          <span className="text-[var(--color-brand-500)]">{a.title[1]}</span>
        </h1>

        <p data-reveal style={{ transitionDelay: "100ms" }} className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--subtle)]">
          {a.lead}
        </p>

        <div data-reveal style={{ transitionDelay: "150ms" }} className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href={a.href}
            className="rounded-full bg-[var(--color-brand-500)] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[var(--color-brand-500)]/20 transition-transform duration-200 hover:scale-[1.03] active:scale-95"
          >
            {a.cta}
          </Link>
          <a
            href="#fonctionnement"
            className="rounded-full border border-[var(--border)] px-7 py-3.5 text-sm font-semibold transition-colors hover:bg-[var(--surface)]"
          >
            Comment ça marche
          </a>
        </div>

        <ul data-reveal style={{ transitionDelay: "200ms" }} className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--subtle)]">
          {a.points.map((p) => (
            <li key={p} className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[var(--color-brand-500)]">
                <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {p}
            </li>
          ))}
        </ul>

        </div>

        {/* Colonne droite : l'interface réelle, pas une photo d'illustration. */}
        <div className="hidden lg:block" data-reveal style={{ transitionDelay: "120ms" }}>
          <HeroVisual />
        </div>
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        {/* Preuve réelle : les canaux de paiement, pas de faux logos clients. */}
        <div data-reveal style={{ transitionDelay: "250ms" }} className="border-t border-[var(--border)] pt-6">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--subtle)]">
            Paiements et versements par
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3">
            {RAILS.map((r) => (
              <span key={r} className="font-display text-base font-bold text-[var(--subtle)]">
                {r}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

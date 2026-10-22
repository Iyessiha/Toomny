'use client';

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Locale } from "@/i18n/dictionaries";

const tierColors = [
  { c1: '#cbd5e1', c2: '#475569', ink: '#1e293b', edge: 'rgba(148, 163, 184, .35)', glow: 'rgba(148, 163, 184, .12)' },
  { c1: '#6ee7b7', c2: '#059669', ink: '#064e3b', edge: 'rgba(52, 211, 153, .55)', glow: 'rgba(52, 211, 153, .28)' },
  { c1: '#a5b4fc', c2: '#4338ca', ink: '#1e1b4b', edge: 'rgba(129, 140, 248, .6)', glow: 'rgba(129, 140, 248, .38)' },
];

const CONTENT = {
  fr: {
    eyebrow: "Pour les prestataires",
    title: "Boostez votre visibilité",
    lead: "Apparaissez en tête du catalogue, marquez vos services d'un badge prioritaire et décrouchez plus de commandes.",
    tiers: [
      {
        name: "Boost Starter",
        price: "5 000 FCFA",
        period: "/mois",
        perks: [
          "Badge prioritaire sur vos services",
          "Remontée dans le catalogue",
        ],
        cta: "Activer",
        highlight: false,
      },
      {
        name: "Boost Pro",
        price: "10 000 FCFA",
        period: "/mois",
        badge: "Populaire",
        perks: [
          "Badge prioritaire sur vos services",
          "Remontée dans le catalogue",
          "Mise en avant dans la recherche",
        ],
        cta: "Activer",
        highlight: true,
      },
      {
        name: "Boost Elite",
        price: "18 000 FCFA",
        period: "/mois",
        perks: [
          "Badge prioritaire sur vos services",
          "Remontée dans le catalogue",
          "Mise en avant dans la recherche",
          "Affiché sur la page d'accueil",
        ],
        cta: "Activer",
        highlight: false,
      },
    ],
    note: "Le Boost s'ajoute à votre plan de base et se renouvelle tous les 30 jours. Résiliable à tout moment.",
    cta: "Gérer mon Boost →",
  },
  en: {
    eyebrow: "For providers",
    title: "Boost your visibility",
    lead: "Appear at the top of the catalogue, mark your services with a priority badge, and land more orders.",
    tiers: [
      {
        name: "Boost Starter",
        price: "5 000 FCFA",
        period: "/month",
        perks: [
          "Priority badge on your services",
          "Moved up in the catalogue",
        ],
        cta: "Activate",
        highlight: false,
      },
      {
        name: "Boost Pro",
        price: "10 000 FCFA",
        period: "/month",
        badge: "Popular",
        perks: [
          "Priority badge on your services",
          "Moved up in the catalogue",
          "Featured in search results",
        ],
        cta: "Activate",
        highlight: true,
      },
      {
        name: "Boost Elite",
        price: "18 000 FCFA",
        period: "/month",
        perks: [
          "Priority badge on your services",
          "Moved up in the catalogue",
          "Featured in search results",
          "Displayed on the home page",
        ],
        cta: "Activate",
        highlight: false,
      },
    ],
    note: "Boost is an add-on on top of your base plan, renewed every 30 days. Cancel anytime.",
    cta: "Manage my Boost →",
  },
};

export function BoostSection({ locale = "fr" }: { locale?: Locale }) {
  const t = CONTENT[locale];
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia('(hover: hover) and (min-width: 1024px)').matches;
    if (reduce || !fine) return;

    const cards = containerRef.current?.querySelectorAll('.boost-card');
    if (!cards) return;

    cards.forEach((card) => {
      card.addEventListener('pointermove', (e: Event) => {
        const event = e as PointerEvent;
        const rect = card.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
        (card as HTMLElement).style.setProperty('--ry', `${((px - 0.5) * 18).toFixed(2)}deg`);
        (card as HTMLElement).style.setProperty('--rx', `${((0.5 - py) * 14).toFixed(2)}deg`);
        (card as HTMLElement).style.setProperty('--gx', `${(px * 100).toFixed(1)}%`);
        (card as HTMLElement).style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
      });
      card.addEventListener('pointerleave', () => {
        (card as HTMLElement).style.setProperty('--rx', '0deg');
        (card as HTMLElement).style.setProperty('--ry', '0deg');
      });
    });
  }, []);

  return (
    <section className="border-t border-[var(--border)] bg-[var(--surface)]">
      <style>{`
        .boost-card {
          position: relative;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          background: linear-gradient(170deg, #141a28 0%, #0a0e17 70%);
          border: 1px solid var(--edge);
          box-shadow: 0 20px 40px -20px rgba(0, 0, 0, .8), 0 0 40px -15px var(--glow);
          min-height: 100%;
          transition: box-shadow 0.45s, transform 0.45s;
          transform-style: preserve-3d;
          transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
          animation: fadeInBoost 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .boost-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(180deg, var(--c2), var(--ink));
          transform: translateZ(-18px);
          filter: brightness(.7);
        }

        .boost-card:hover {
          box-shadow: 0 44px 80px -30px rgba(0, 0, 0, .95), 0 0 90px -10px var(--glow);
        }

        .boost-glare {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          z-index: 3;
          background: radial-gradient(circle at var(--gx, 50%) var(--gy, 0%), rgba(255, 255, 255, .22), transparent 55%);
          opacity: 0;
          transition: opacity 0.3s;
        }

        .boost-card:hover .boost-glare {
          opacity: 1;
        }

        .boost-layer {
          position: relative;
          transform: translateZ(40px);
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .boost-badge {
          position: absolute;
          top: -13px;
          left: 50%;
          transform: translate(-50%, 0) translateZ(70px);
          white-space: nowrap;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--ink);
          background: linear-gradient(90deg, var(--c1), var(--c2));
          padding: 6px 14px;
          border-radius: 999px;
          z-index: 4;
          box-shadow: 0 8px 22px -6px var(--c2);
        }

        .boost-name {
          font-size: clamp(18px, 3vw, 20px);
          font-weight: 800;
          color: #f8fafc;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .boost-price {
          margin-top: 16px;
          font-size: clamp(22px, 5vw, 28px);
          font-weight: 800;
          color: #fff;
        }

        .boost-period {
          font-size: 13px;
          font-weight: 500;
          color: #94a3b8;
          margin-left: 6px;
        }

        .boost-hr {
          border: 0;
          border-top: 1px solid rgba(148, 163, 184, .18);
          margin: 16px 0;
        }

        @media (min-width: 1024px) {
          .boost-hr {
            margin: 20px 0;
          }
        }

        .boost-perks {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          gap: 9px;
          flex: 1;
        }

        @media (min-width: 1024px) {
          .boost-perks {
            gap: 11px;
          }
        }

        .boost-perk {
          display: flex;
          gap: 8px;
          font-size: clamp(13px, 2.2vw, 14px);
          line-height: 1.4;
          color: #e2e8f0;
        }

        .boost-perk::before {
          content: '✓';
          flex: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          font-size: 10px;
          font-weight: 800;
          color: var(--ink);
          background: var(--c1);
          flex-shrink: 0;
          margin-top: 2px;
        }

        @media (min-width: 1024px) {
          .boost-perk::before {
            width: 18px;
            height: 18px;
            font-size: 11px;
          }
        }

        .boost-cta {
          margin-top: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-decoration: none;
          padding: 11px 14px;
          border-radius: 999px;
          font-size: clamp(12px, 2.2vw, 14px);
          font-weight: 800;
          color: var(--ink);
          background: linear-gradient(90deg, var(--c1), var(--c2));
          box-shadow: 0 12px 26px -10px var(--c2);
          transition: transform 0.2s, box-shadow 0.2s;
          cursor: pointer;
          border: none;
          width: 100%;
        }

        @media (min-width: 1024px) {
          .boost-cta {
            margin-top: 22px;
            padding: 13px 16px;
            width: auto;
          }
        }

        .boost-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 34px -10px var(--c2);
        }

        .boost-card.highlight .boost-card::after {
          animation: halo 3.2s ease-in-out infinite;
        }

        @keyframes halo {
          0%, 100% { box-shadow: 0 30px 60px -28px rgba(0, 0, 0, .9), 0 0 50px -18px var(--glow); }
          50% { box-shadow: 0 30px 60px -28px rgba(0, 0, 0, .9), 0 0 90px -8px var(--glow); }
        }

        @keyframes fadeInBoost {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (min-width: 640px) {
          .boost-card {
            border-radius: 18px;
            padding: 24px;
          }
        }

        @media (min-width: 1024px) {
          .boost-card {
            border-radius: 22px;
            padding: 28px 24px 24px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation: none !important;
            transition: none !important;
          }
        }

        @media (hover: none) {
          .boost-card {
            transform: none;
          }
        }
      `}</style>

      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        {/* Header */}
        <div data-reveal className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-brand-600)]">
            {t.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">{t.title}</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-[var(--subtle)]">
            {t.lead}
          </p>
        </div>

        {/* Tier cards */}
        <div className="mt-12 grid gap-6 sm:grid-cols-3" ref={containerRef}>
          {t.tiers.map((tier, idx) => {
            const color = tierColors[idx];
            return (
              <div
                key={tier.name}
                data-reveal
                className={`boost-card ${tier.highlight ? 'highlight' : ''}`}
                style={{
                  '--c1': color.c1,
                  '--c2': color.c2,
                  '--ink': color.ink,
                  '--edge': color.edge,
                  '--glow': color.glow,
                } as React.CSSProperties & Record<string, string>}
              >
                <div className="boost-glare"></div>
                {tier.badge && <span className="boost-badge">{tier.badge}</span>}
                <div className="boost-layer">
                  <p className="boost-name">{tier.name}</p>
                  <div className="boost-price">
                    {tier.price}
                    <span className="boost-period">{tier.period}</span>
                  </div>
                  <hr className="boost-hr" />
                  <ul className="boost-perks">
                    {tier.perks.map((perk) => (
                      <li key={perk} className="boost-perk">
                        {perk}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/auth?role=provider"
                    className="boost-cta"
                  >
                    {tier.cta}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <p data-reveal className="mt-6 text-center text-xs text-[var(--subtle)]">
          {t.note}
        </p>
      </div>
    </section>
  );
}

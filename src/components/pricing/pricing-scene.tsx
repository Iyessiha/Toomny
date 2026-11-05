'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

interface Plan {
  name: string;
  price: string;
  priceNote: string;
  commission: string;
  badge: string | null;
  highlight: boolean;
  features: string[];
  cta: string;
  href: string;
}

const tierColors = [
  { name: 't1', c1: '#cbd5e1', c2: '#475569', ink: '#1e293b', edge: 'rgba(148, 163, 184, .35)', glow: 'rgba(148, 163, 184, .12)' },
  { name: 't2', c1: '#6ee7b7', c2: '#059669', ink: '#064e3b', edge: 'rgba(52, 211, 153, .55)', glow: 'rgba(52, 211, 153, .28)' },
  { name: 't3', c1: '#a5b4fc', c2: '#4338ca', ink: '#1e1b4b', edge: 'rgba(129, 140, 248, .6)', glow: 'rgba(129, 140, 248, .38)' },
  { name: 't4', c1: '#fde68a', c2: '#b45309', ink: '#451a03', edge: 'rgba(251, 191, 36, .8)', glow: 'rgba(251, 191, 36, .5)' },
];

interface PricingSceneProps {
  plans: Plan[];
  locale: string;
  columns?: 2 | 3 | 4;
}

export function PricingScene({ plans, locale, columns = 4 }: PricingSceneProps) {
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia('(hover: hover) and (min-width: 1024px)').matches;
    if (reduce || !fine) return;

    const cards = sceneRef.current?.querySelectorAll('.pricing-card');
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

  const getCommissionValue = (commission: string) => {
    const percent = parseInt(commission);
    if (percent === 10) return '89 100';
    if (percent === 8) return '91 080';
    if (percent === 5) return '94 050';
    if (percent === 3) return '96 030';
    return '100 000';
  };

  return (
    <div className="pricing-section overflow-hidden">
      <style>{`
        .pricing-section {
          --rx: 0deg;
          --ry: 0deg;
          --gx: 50%;
          --gy: 0%;
          background: linear-gradient(to bottom, transparent, rgba(99, 102, 241, 0.05));
          padding: 24px 16px;
        }

        @media (min-width: 640px) {
          .pricing-section {
            padding: 32px 24px;
          }
        }

        @media (min-width: 1024px) {
          .pricing-section {
            padding: 40px 32px;
          }
        }

        .pricing-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          max-width: 1280px;
          margin: 0 auto;
          perspective: 1200px;
          perspective-origin: 50% 20%;
        }

        @media (min-width: 640px) {
          .pricing-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .pricing-grid {
            grid-template-columns: repeat(${columns}, 1fr);
          }
        }

        .pricing-slot {
          transform-style: preserve-3d;
          animation: fadeIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .pricing-slot.t1 { animation-delay: 0.1s; }
        .pricing-slot.t2 { animation-delay: 0.15s; }
        .pricing-slot.t3 { animation-delay: 0.2s; }
        .pricing-slot.t4 { animation-delay: 0.25s; }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .pricing-card {
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
        }

        @media (min-width: 640px) {
          .pricing-card {
            border-radius: 18px;
            padding: 24px;
          }
        }

        @media (min-width: 1024px) {
          .pricing-card {
            border-radius: 22px;
            padding: 28px 24px 24px;
          }
        }

        .pricing-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(180deg, var(--c2), var(--ink));
          transform: translateZ(-18px);
          filter: brightness(.7);
        }

        .pricing-card:hover {
          box-shadow: 0 44px 80px -30px rgba(0, 0, 0, .95), 0 0 90px -10px var(--glow);
        }

        .pricing-glare {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          z-index: 3;
          background: radial-gradient(circle at var(--gx, 50%) var(--gy, 0%), rgba(255, 255, 255, .22), transparent 55%);
          opacity: 0;
          transition: opacity 0.3s;
        }

        .pricing-card:hover .pricing-glare {
          opacity: 1;
        }

        .pricing-layer {
          position: relative;
          transform: translateZ(40px);
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .pricing-badge {
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

        .pricing-tier-no {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--c1);
        }

        .pricing-plan {
          font-size: clamp(20px, 4vw, 24px);
          font-weight: 800;
          margin: 6px 0 0;
          letter-spacing: -0.02em;
          color: #f8fafc;
        }

        .pricing-tag {
          margin: 8px 0 0;
          font-size: clamp(13px, 2.5vw, 14px);
          line-height: 1.4;
          color: #94a3b8;
          min-height: auto;
        }

        .pricing-price {
          margin-top: 16px;
          font-size: clamp(24px, 5vw, 30px);
          font-weight: 800;
          color: #fff;
        }

        .pricing-price.free {
          color: var(--c1);
        }

        .pricing-price-note {
          font-size: 13px;
          font-weight: 500;
          color: #94a3b8;
          margin-left: 6px;
        }

        .pricing-hr {
          border: 0;
          border-top: 1px solid rgba(148, 163, 184, .18);
          margin: 16px 0;
        }

        @media (min-width: 1024px) {
          .pricing-hr {
            margin: 20px 0;
          }
        }

        .pricing-features {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          gap: 9px;
          flex: 1;
        }

        @media (min-width: 1024px) {
          .pricing-features {
            gap: 11px;
          }
        }

        .pricing-feature {
          display: flex;
          gap: 8px;
          font-size: clamp(12px, 2.2vw, 14px);
          line-height: 1.4;
          color: #e2e8f0;
        }

        .pricing-feature::before {
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
          .pricing-feature::before {
            width: 18px;
            height: 18px;
            font-size: 11px;
          }
        }

        .pricing-fee {
          margin: 16px 0 0;
          padding-top: 12px;
          border-top: 1px dashed rgba(148, 163, 184, .2);
          font-size: clamp(11px, 2vw, 12px);
          line-height: 1.5;
          color: #64748b;
        }

        @media (min-width: 1024px) {
          .pricing-fee {
            margin: 20px 0 0;
            padding-top: 14px;
          }
        }

        .pricing-fee b {
          color: #94a3b8;
          font-weight: 600;
        }

        .pricing-cta {
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
          .pricing-cta {
            margin-top: 22px;
            padding: 13px 16px;
            width: auto;
          }
        }

        .pricing-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 34px -10px var(--c2);
        }

        .t1 .pricing-cta {
          color: #e2e8f0;
          background: none;
          border: 1px solid rgba(203, 213, 225, .4);
          box-shadow: none;
        }

        .t1 .pricing-cta:hover {
          background: rgba(203, 213, 225, .08);
        }

        .t3 .pricing-card {
          animation: halo 3.2s ease-in-out infinite;
        }

        @keyframes halo {
          0%, 100% { box-shadow: 0 30px 60px -28px rgba(0, 0, 0, .9), 0 0 50px -18px var(--glow); }
          50% { box-shadow: 0 30px 60px -28px rgba(0, 0, 0, .9), 0 0 90px -8px var(--glow); }
        }

        .t4 .pricing-card {
          background: linear-gradient(170deg, #2a1d05 0%, #120c02 75%);
          box-shadow: 0 40px 90px -30px rgba(0, 0, 0, .95), 0 0 120px -12px var(--glow);
        }

        .t4 .pricing-card::before {
          filter: brightness(.9);
        }

        .pricing-sheen {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          z-index: 2;
          background: linear-gradient(105deg, transparent 40%, rgba(255, 246, 200, .32) 50%, transparent 60%);
          background-size: 260% 100%;
          animation: sweep 4.2s linear infinite;
          mix-blend-mode: screen;
          display: none;
        }

        .t4 .pricing-sheen {
          display: block;
        }

        @keyframes sweep {
          from { background-position: 130% 0; }
          to { background-position: -130% 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation: none !important;
            transition: none !important;
          }
          .pricing-slot {
            opacity: 1;
          }
        }

        @media (hover: none) {
          .pricing-card {
            transform: none;
          }
        }
      `}</style>

      <div className="pricing-grid" ref={sceneRef}>
        {plans.map((plan, idx) => {
          const color = tierColors[idx];
          return (
            <div
              key={plan.name}
              className={`pricing-slot ${color.name}`}
              style={{
                '--c1': color.c1,
                '--c2': color.c2,
                '--ink': color.ink,
                '--edge': color.edge,
                '--glow': color.glow,
              } as React.CSSProperties & Record<string, string>}
            >
              <article className="pricing-card">
                <div className="pricing-glare"></div>
                {color.name === 't4' && <div className="pricing-sheen"></div>}
                {plan.badge && <span className="pricing-badge">{plan.badge}</span>}
                <div className="pricing-layer">
                  <span className="pricing-tier-no">{plan.name}</span>
                  <p className="pricing-plan">{plan.name}</p>
                  <p className="pricing-tag">
                    {idx === 0 && locale === 'fr' && 'Recevez vos premiers clients gratuitement'}
                    {idx === 1 && locale === 'fr' && 'Publiez 4 fois plus pour être vu davantage'}
                    {idx === 2 && locale === 'fr' && 'Pilotez vos ventes avec un tableau de bord complet'}
                    {idx === 3 && locale === 'fr' && 'Le niveau le plus haut : visibilité maximale et accompagnement dédié'}
                    {idx === 0 && locale !== 'fr' && 'Get your first clients for free'}
                    {idx === 1 && locale !== 'fr' && 'Publish 4x more to get more visibility'}
                    {idx === 2 && locale !== 'fr' && 'Manage your sales with a complete dashboard'}
                    {idx === 3 && locale !== 'fr' && 'Highest tier: maximum visibility and dedicated support'}
                  </p>
                  <div className={`pricing-price ${plan.price === 'Gratuit' || plan.price === 'Free' ? 'free' : ''}`}>
                    {plan.price}
                    {plan.priceNote && <span className="pricing-price-note">{plan.priceNote}</span>}
                  </div>
                  <hr className="pricing-hr" />
                  <ul className="pricing-features">
                    {plan.features.map((feature) => (
                      <li key={feature} className="pricing-feature">
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="pricing-fee">
                    <b>
                      {locale === 'fr' ? 'Commission Toomny : ' : 'Toomny commission: '}
                      {plan.commission}
                      {locale === 'fr' ? ' par commande.' : ' per order.'}
                    </b>{' '}
                    {locale === 'fr' ? 'Sur 100 000 FCFA, vous touchez' : 'On 100,000 CFA, you earn'}{' '}
                    {getCommissionValue(plan.commission)} FCFA.
                  </div>
                  <Link href={plan.href} className="pricing-cta">
                    {plan.cta}
                  </Link>
                </div>
              </article>
            </div>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useRef } from 'react';

export interface FeatureCard {
  title: string;
  body: string;
  icon?: string;
  index?: number;
}

interface FeatureCardsProps {
  cards: FeatureCard[];
  columns?: 'auto' | 2 | 3 | 4;
  showArrows?: boolean;
  variant?: 'default' | 'colorful';
  withGlare?: boolean;
}

const colorPalettes = [
  { c1: '#cbd5e1', c2: '#475569', ink: '#1e293b', edge: 'rgba(148, 163, 184, .35)', glow: 'rgba(148, 163, 184, .12)' },
  { c1: '#6ee7b7', c2: '#059669', ink: '#064e3b', edge: 'rgba(52, 211, 153, .55)', glow: 'rgba(52, 211, 153, .28)' },
  { c1: '#a5b4fc', c2: '#4338ca', ink: '#1e1b4b', edge: 'rgba(129, 140, 248, .6)', glow: 'rgba(129, 140, 248, .38)' },
  { c1: '#fde68a', c2: '#b45309', ink: '#451a03', edge: 'rgba(251, 191, 36, .8)', glow: 'rgba(251, 191, 36, .5)' },
];

export function FeatureCards({
  cards,
  columns = 'auto',
  showArrows = true,
  variant = 'default',
  withGlare = true,
}: FeatureCardsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (variant !== 'colorful') return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia('(hover: hover) and (min-width: 1024px)').matches;
    if (reduce || !fine) return;

    const featureCards = containerRef.current?.querySelectorAll('.feature-card');
    if (!featureCards) return;

    featureCards.forEach((card) => {
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
  }, [variant]);

  const gridColumns = {
    auto: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-auto',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <>
      <style>{`
        .feature-cards-section {
          --rx: 0deg;
          --ry: 0deg;
          --gx: 50%;
          --gy: 0%;
        }

        .feature-cards-grid {
          display: grid;
          gap: 24px;
          max-width: 1280px;
          margin: 0 auto;
        }

        .feature-card {
          position: relative;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          background: linear-gradient(170deg, #141a28 0%, #0a0e17 70%);
          border: 1px solid var(--edge, rgba(148, 163, 184, .35));
          box-shadow: 0 20px 40px -20px rgba(0, 0, 0, .8), 0 0 40px -15px var(--glow, rgba(148, 163, 184, .12));
          min-height: 100%;
          transition: box-shadow 0.45s, transform 0.45s;
          animation: fadeInCard 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .feature-card.colorful {
          transform-style: preserve-3d;
          transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
        }

        .feature-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(180deg, var(--c2, #475569), var(--ink, #1e293b));
          transform: translateZ(-18px);
          filter: brightness(.7);
        }

        .feature-card:hover {
          box-shadow: 0 44px 80px -30px rgba(0, 0, 0, .95), 0 0 90px -10px var(--glow, rgba(148, 163, 184, .12));
        }

        .feature-glare {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          z-index: 3;
          background: radial-gradient(circle at var(--gx, 50%) var(--gy, 0%), rgba(255, 255, 255, .22), transparent 55%);
          opacity: 0;
          transition: opacity 0.3s;
        }

        .feature-card:hover .feature-glare {
          opacity: 1;
        }

        .feature-layer {
          position: relative;
          transform: translateZ(40px);
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .feature-icon {
          font-size: clamp(24px, 6vw, 32px);
          line-height: 1;
          margin-bottom: 8px;
        }

        .feature-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--c1, #cbd5e1);
          color: var(--ink, #1e293b);
          font-size: 12px;
          font-weight: 800;
          margin-bottom: 12px;
        }

        .feature-title {
          font-size: clamp(16px, 3vw, 18px);
          font-weight: 800;
          color: #f8fafc;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .feature-body {
          font-size: clamp(13px, 2.2vw, 14px);
          line-height: 1.5;
          color: #94a3b8;
          margin: 8px 0 0;
        }

        .feature-arrow {
          position: absolute;
          -right: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(148, 163, 184, .3);
          font-size: 20px;
          display: none;
        }

        @media (min-width: 1024px) {
          .feature-arrow {
            display: block;
          }
        }

        @keyframes fadeInCard {
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
          .feature-card {
            border-radius: 18px;
            padding: 24px;
          }
        }

        @media (min-width: 1024px) {
          .feature-card {
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
          .feature-card {
            transform: none;
          }
        }

        .feature-cards-grid.cols-auto {
          grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
        }

        .feature-cards-grid.cols-2 {
          grid-template-columns: 1fr;
        }

        @media (min-width: 640px) {
          .feature-cards-grid.cols-2 {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .feature-cards-grid.cols-3 {
          grid-template-columns: 1fr;
        }

        @media (min-width: 640px) {
          .feature-cards-grid.cols-3 {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .feature-cards-grid.cols-3 {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .feature-cards-grid.cols-4 {
          grid-template-columns: 1fr;
        }

        @media (min-width: 640px) {
          .feature-cards-grid.cols-4 {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .feature-cards-grid.cols-4 {
            grid-template-columns: repeat(4, 1fr);
          }
        }
      `}</style>

      <div className="feature-cards-section" ref={containerRef}>
        <div className={`feature-cards-grid cols-${columns}`}>
          {cards.map((card, idx) => {
            const palette = variant === 'colorful' ? colorPalettes[idx % colorPalettes.length] : null;
            const showNumber = card.index !== undefined;

            return (
              <div
                key={idx}
                className={`feature-card ${variant === 'colorful' ? 'colorful' : ''}`}
                style={
                  palette
                    ? {
                        '--c1': palette.c1,
                        '--c2': palette.c2,
                        '--ink': palette.ink,
                        '--edge': palette.edge,
                        '--glow': palette.glow,
                      }
                    : ({} as React.CSSProperties)
                }
              >
                {withGlare && <div className="feature-glare"></div>}
                <div className="feature-layer">
                  {card.icon && <div className="feature-icon">{card.icon}</div>}
                  {showNumber && <div className="feature-number">{card.index! + 1}</div>}
                  <h3 className="feature-title">{card.title}</h3>
                  <p className="feature-body">{card.body}</p>
                </div>
                {showArrows && idx < cards.length - 1 && <span className="feature-arrow" aria-hidden="true">→</span>}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

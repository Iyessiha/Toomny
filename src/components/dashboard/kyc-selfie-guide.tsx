/**
 * Illustration SVG montrant comment tenir sa pièce d'identité
 * pour la photo selfie KYC. Thème-aware via currentColor + CSS vars.
 */
export function KycSelfieGuide({ locale = "fr" }: { locale?: "fr" | "en" }) {
  const labels = {
    fr: {
      title: "Comment prendre la photo",
      face: "Visage net et dégagé",
      doc: "Document entier visible",
      light: "Bonne lumière",
      ok: "Bon exemple",
    },
    en: {
      title: "How to take the photo",
      face: "Clear, unobstructed face",
      doc: "Whole document visible",
      light: "Good lighting",
      ok: "Good example",
    },
  }[locale];

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="mb-3 text-xs font-semibold text-[var(--subtle)] uppercase tracking-wide">
        {labels.title}
      </p>

      <svg
        viewBox="0 0 320 180"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="w-full max-w-sm mx-auto"
      >
        {/* ── Fond ── */}
        <rect width="320" height="180" rx="10" fill="var(--surface)" />

        {/* ── Cadre viewfinder ── */}
        <rect x="20" y="14" width="280" height="152" rx="8"
          fill="none" stroke="var(--color-brand-500)" strokeWidth="1.5"
          strokeDasharray="6 3" opacity="0.6" />
        {/* Coins style caméra */}
        {[
          [20, 14], [280, 14], [20, 148], [280, 148]
        ].map(([cx, cy], i) => {
          const dx = i % 2 === 0 ? 1 : -1;
          const dy = i < 2 ? 1 : -1;
          return (
            <g key={i}>
              <line x1={cx} y1={cy + dy * 2} x2={cx} y2={cy + dy * 16}
                stroke="var(--color-brand-500)" strokeWidth="3" strokeLinecap="round" />
              <line x1={cx + dx * 2} y1={cy} x2={cx + dx * 16} y2={cy}
                stroke="var(--color-brand-500)" strokeWidth="3" strokeLinecap="round" />
            </g>
          );
        })}

        {/* ── Silhouette buste ── */}
        {/* Tête */}
        <ellipse cx="118" cy="68" rx="28" ry="32"
          fill="var(--border)" stroke="var(--subtle)" strokeWidth="1.5" />
        {/* Oreilles */}
        <ellipse cx="90" cy="68" rx="5" ry="8"
          fill="var(--border)" stroke="var(--subtle)" strokeWidth="1" />
        <ellipse cx="146" cy="68" rx="5" ry="8"
          fill="var(--border)" stroke="var(--subtle)" strokeWidth="1" />
        {/* Cou */}
        <rect x="110" y="97" width="16" height="14" rx="3"
          fill="var(--border)" />
        {/* Épaules/buste */}
        <path d="M 60 160 Q 70 110 118 108 Q 166 110 176 160 Z"
          fill="var(--border)" stroke="var(--subtle)" strokeWidth="1.5" />
        {/* Traits du visage (nez + bouche simplifiés) */}
        <ellipse cx="118" cy="70" rx="4" ry="5" fill="var(--subtle)" opacity="0.35" />
        <path d="M 109 82 Q 118 88 127 82"
          fill="none" stroke="var(--subtle)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        {/* Yeux */}
        <ellipse cx="107" cy="60" rx="5" ry="4" fill="var(--subtle)" opacity="0.4" />
        <ellipse cx="129" cy="60" rx="5" ry="4" fill="var(--subtle)" opacity="0.4" />

        {/* ── Bras / main tenant la carte ── */}
        {/* Avant-bras */}
        <path d="M 170 140 Q 185 120 190 100"
          fill="none" stroke="var(--border)" strokeWidth="14" strokeLinecap="round" />
        <path d="M 170 140 Q 185 120 190 100"
          fill="none" stroke="var(--subtle)" strokeWidth="1" strokeLinecap="round" opacity="0.3" />

        {/* ── Carte d'identité ── */}
        <rect x="192" y="64" width="90" height="62" rx="6"
          fill="var(--background)" stroke="var(--color-brand-500)" strokeWidth="2" />
        {/* Chip / photo miniature sur la carte */}
        <rect x="200" y="74" width="20" height="16" rx="3"
          fill="var(--color-brand-50)" stroke="var(--color-brand-300)" strokeWidth="1" />
        <ellipse cx="210" cy="82" rx="6" ry="7"
          fill="var(--color-brand-200)" opacity="0.8" />
        {/* Lignes de texte simulées */}
        <rect x="226" y="76" width="46" height="3" rx="1.5"
          fill="var(--subtle)" opacity="0.45" />
        <rect x="226" y="83" width="36" height="3" rx="1.5"
          fill="var(--subtle)" opacity="0.35" />
        <rect x="226" y="90" width="42" height="3" rx="1.5"
          fill="var(--subtle)" opacity="0.3" />
        {/* Bande MRZ en bas de la carte */}
        <rect x="200" y="112" width="74" height="4" rx="1"
          fill="var(--subtle)" opacity="0.2" />
        <rect x="200" y="119" width="74" height="4" rx="1"
          fill="var(--subtle)" opacity="0.15" />

        {/* ── Flèche visage ── */}
        <line x1="118" y1="28" x2="118" y2="16"
          stroke="var(--color-brand-500)" strokeWidth="1.5"
          strokeDasharray="3 2" opacity="0.7" />
        <polygon points="114,18 122,18 118,12"
          fill="var(--color-brand-500)" opacity="0.7" />

        {/* ── Flèche carte ── */}
        <line x1="237" y1="28" x2="237" y2="16"
          stroke="var(--color-brand-500)" strokeWidth="1.5"
          strokeDasharray="3 2" opacity="0.7" />
        <polygon points="233,18 241,18 237,12"
          fill="var(--color-brand-500)" opacity="0.7" />

        {/* ── Pastille ✓ visage ── */}
        <circle cx="148" cy="38" r="9"
          fill="var(--color-brand-500)" />
        <path d="M 144 38 l 3 3 l 5.5 -5.5"
          fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />

        {/* ── Pastille ✓ carte ── */}
        <circle cx="268" cy="38" r="9"
          fill="var(--color-brand-500)" />
        <path d="M 264 38 l 3 3 l 5.5 -5.5"
          fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />

      </svg>

      {/* Légende texte sous l'illustration */}
      <div className="mt-3 flex justify-around gap-2 text-[11px] text-[var(--subtle)]">
        <span className="flex items-center gap-1">
          <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-500)] text-white">
            <svg viewBox="0 0 12 12" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 6l3 3 5-5" />
            </svg>
          </span>
          {labels.face}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-500)] text-white">
            <svg viewBox="0 0 12 12" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 6l3 3 5-5" />
            </svg>
          </span>
          {labels.doc}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-500)] text-white">
            <svg viewBox="0 0 12 12" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 6l3 3 5-5" />
            </svg>
          </span>
          {labels.light}
        </span>
      </div>
    </div>
  );
}

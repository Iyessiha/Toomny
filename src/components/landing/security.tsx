import { getLanding } from "@/content/landing";
import type { Locale } from "@/i18n/dictionaries";

/** Icône distincte par garantie (dans l'ordre du tableau `guarantees`). */
const GUARANTEE_ICONS = [
  // 1. Fonds ne transitent pas par nous — banque / coffre-fort
  <svg key="g1" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="14" x="3" y="7" rx="2"/>
    <path d="M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/>
    <circle cx="12" cy="13" r="2"/>
    <path d="M12 15v2"/>
  </svg>,
  // 2. Identité vérifiée — bouclier check
  <svg key="g2" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>,
  // 3. Litige arbitré — balance de justice
  <svg key="g3" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
    <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
    <path d="M7 21h10"/>
    <path d="M12 3v18"/>
    <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>
  </svg>,
  // 4. Validation automatique 72h — horloge
  <svg key="g4" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>,
];

const GUARANTEE_COLORS = [
  { bg: "bg-[var(--color-brand-50)]", text: "text-[var(--color-brand-600)]" },
  { bg: "bg-green-50", text: "text-green-600" },
  { bg: "bg-violet-50", text: "text-violet-600" },
  { bg: "bg-amber-50", text: "text-amber-600" },
];

export function Security({ locale = "fr" }: { locale?: Locale }) {
  const t = getLanding(locale).security;
  const GUARANTEES = t.guarantees;

  return (
    <section id="securite" className="border-t border-[var(--border)]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          {/* Colonne gauche : texte + flow */}
          <div data-reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-brand-600)]">
              {t.eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
              {t.title}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-[var(--subtle)]">{t.lead}</p>

            {/* Flow visuel du paiement */}
            <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-brand-50)] text-[var(--color-brand-600)]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <p className="font-display text-sm font-bold text-[var(--color-brand-700)]">
                  {t.flowTitle}
                </p>
              </div>

              <ol className="space-y-0">
                {t.flow.map((s, i) => (
                  <li key={s} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-500)] text-[10px] font-bold text-white">
                        {i + 1}
                      </span>
                      {i < t.flow.length - 1 && (
                        <span className="my-0.5 h-5 w-px bg-[var(--color-brand-200)]" />
                      )}
                    </div>
                    <p className="pb-2 pt-0.5 text-sm text-[var(--subtle)]">{s}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Colonne droite : 4 garanties */}
          <div className="grid gap-4 sm:grid-cols-2">
            {GUARANTEES.map((g, i) => {
              const c = GUARANTEE_COLORS[i % GUARANTEE_COLORS.length];
              return (
                <div
                  key={g.title}
                  data-reveal
                  style={{ transitionDelay: `${(i % 2) * 80}ms` }}
                  className="group rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/[0.05]"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.bg} ${c.text}`}>
                    {GUARANTEE_ICONS[i]}
                  </div>
                  <h3 className="mt-4 font-display text-base font-bold leading-snug">{g.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--subtle)]">{g.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

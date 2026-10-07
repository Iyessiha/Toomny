import { getLanding } from "@/content/landing";
import type { Locale } from "@/i18n/dictionaries";

export function Security({ locale = "fr" }: { locale?: Locale }) {
  const t = getLanding(locale).security;
  const GUARANTEES = t.guarantees;

  return (
    <section id="securite" className="border-t border-[var(--border)]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div data-reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-brand-600)]">
              {t.eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
              {t.title}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-[var(--subtle)]">{t.lead}</p>

            <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-6">
              <p className="font-display text-sm font-bold text-[var(--color-brand-700)]">
                {t.flowTitle}
              </p>
              <ol className="mt-4 space-y-3 text-sm text-[var(--subtle)]">
                {t.flow.map((s, i) => (
                  <li key={s} className="flex gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-500)] text-[11px] font-bold text-white">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {GUARANTEES.map((g, i) => (
              <div
                key={g.title}
                data-reveal
                style={{ transitionDelay: `${(i % 2) * 80}ms` }}
                className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-brand-50)] text-[var(--color-brand-600)]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                  </svg>
                </div>
                <h3 className="mt-4 font-display text-base font-bold">{g.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--subtle)]">{g.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

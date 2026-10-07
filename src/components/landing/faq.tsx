import { getLanding } from "@/content/landing";
import type { Locale } from "@/i18n/dictionaries";

export function Faq({ locale = "fr" }: { locale?: Locale }) {
  const t = getLanding(locale).faq;

  return (
    <section className="border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-28">
        <h2 data-reveal className="text-3xl font-bold leading-tight sm:text-4xl">{t.title}</h2>

        <div className="mt-10 divide-y divide-[var(--border)] border-y border-[var(--border)]">
          {t.items.map((item) => (
            <details key={item.q} data-reveal className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-base font-semibold [&::-webkit-details-marker]:hidden">
                {item.q}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[var(--color-brand-500)] transition-transform duration-300 group-open:rotate-45">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </summary>
              <p className="mt-3 pr-10 text-sm leading-relaxed text-[var(--subtle)]">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

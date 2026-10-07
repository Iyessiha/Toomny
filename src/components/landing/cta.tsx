import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { getLanding } from "@/content/landing";
import type { Locale } from "@/i18n/dictionaries";

export function FinalCta({ locale = "fr" }: { locale?: Locale }) {
  const t = getLanding(locale).cta;
  return (
    <section className="border-t border-[var(--border)]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div
          data-reveal
          className="relative overflow-hidden rounded-3xl bg-[var(--color-brand-700)] px-6 py-16 text-center sm:px-16 sm:py-24"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-25"
            style={{
              background:
                "radial-gradient(50% 60% at 50% 0%, var(--color-brand-400) 0%, transparent 70%)",
            }}
          />
          <div className="relative">
            <span className="inline-flex text-white/90">
              <Logo size={44} withWordmark={false} />
            </span>
            <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-bold leading-tight text-white sm:text-5xl">
              {t.title}
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-white/75 sm:text-lg">{t.lead}</p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link
                href="/auth"
                className="rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[var(--color-brand-700)] transition-transform duration-200 hover:scale-[1.03] active:scale-95"
              >
                {t.primary}
              </Link>
              <Link
                href="/services"
                className="rounded-full border border-white/25 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                {t.secondary}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

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
          {/* Halo radial haut */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-25"
            style={{
              background:
                "radial-gradient(50% 60% at 50% 0%, var(--color-brand-400) 0%, transparent 70%)",
            }}
          />

          {/* Marque Toomny en filigrane */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.06]"
          >
            <svg viewBox="0 0 120 120" width="420" height="420" fill="none">
              <circle cx="43" cy="22" r="11.5" fill="white"/>
              <circle cx="77" cy="22" r="11.5" fill="white"/>
              <g fill="none" stroke="white" strokeWidth="9" strokeLinecap="butt">
                <path d="M74 50C62 34 32 37 29 58C26 79 47 87 54 100"/>
                <path d="M46 50C58 34 88 37 91 58C94 79 73 87 66 100"/>
              </g>
            </svg>
          </div>

          {/* Dot grid subtil */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />

          <div className="relative">
            <span className="inline-flex text-white/90">
              <Logo size={44} withWordmark={false} />
            </span>

            {/* Pill trust signal */}
            <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              <span className="text-xs font-semibold text-white/80">
                {locale === "fr" ? "Paiement mobile money · Afrique de l'Ouest" : "Mobile money payments · West Africa"}
              </span>
            </div>

            <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-bold leading-tight text-white sm:text-5xl">
              {t.title}
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-white/75 sm:text-lg">{t.lead}</p>

            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link
                href="/auth"
                className="rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[var(--color-brand-700)] shadow-xl shadow-black/20 transition-all duration-200 hover:scale-[1.03] hover:shadow-2xl active:scale-95"
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

            {/* Mini stats */}
            <div className="mx-auto mt-10 flex flex-wrap justify-center gap-8">
              {[
                { n: "10 %", label: locale === "fr" ? "de commission" : "commission" },
                { n: "0 %", label: locale === "fr" ? "côté client" : "client fee" },
                { n: "72 h", label: locale === "fr" ? "validation auto" : "auto-approval" },
              ].map(({ n, label }) => (
                <div key={n} className="text-center">
                  <p className="font-display text-2xl font-extrabold text-white">{n}</p>
                  <p className="mt-0.5 text-xs text-white/60">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

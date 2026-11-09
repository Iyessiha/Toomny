import Image from "next/image";
import Link from "next/link";
import { getLanding } from "@/content/landing";
import type { Locale } from "@/i18n/dictionaries";

/** Catégories de services : cartes sobres, icône de marque, description et lien vers le catalogue filtré. */
export function Categories({ locale = "fr" }: { locale?: Locale }) {
  const t = getLanding(locale).categories;

  return (
    <section id="categories" className="border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <div data-reveal className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-text-1)]">{t.eyebrow}</p>
            <h2 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">{t.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--subtle)]">{t.lead}</p>
          </div>
          <Link href="/services" className="shrink-0 text-sm font-semibold text-[var(--brand-text-1)] hover:underline">
            {locale === "fr" ? "Tout le catalogue" : "Full catalogue"} →
          </Link>
        </div>

        <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.items.map((c) => {
            return (
              <li key={c.slug} data-reveal>
                <Link
                  href={`/services?categorie=${c.slug}`}
                  className="group flex h-full items-start gap-4 rounded-xl border border-[var(--border)] bg-[var(--background)] p-5 transition-colors hover:border-[var(--brand-text-2)]"
                >
                  {/* Les vignettes sont des illustrations à fond pastel, dessinées
                      pour du blanc. Sur le fond nocturne, un voile teinté les
                      ramène dans la palette sans les redessiner : elles se lisent
                      comme des tuiles de verre, pas comme des autocollants. */}
                  <span className="relative h-11 w-11 flex-none overflow-hidden rounded-xl ring-1 ring-white/12">
                    <Image
                      src={`/images/categories/${c.slug}.png`}
                      alt=""
                      width={44}
                      height={44}
                      className="h-full w-full object-cover"
                    />
                    <span
                      aria-hidden
                      className="absolute inset-0 bg-gradient-to-br from-[#04110b]/55 via-[#062a18]/35 to-[#108043]/30"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate font-semibold text-[var(--foreground)]">{c.name}</span>
                      <span aria-hidden className="text-[var(--subtle)] transition-transform group-hover:translate-x-0.5">→</span>
                    </span>
                    <span className="mt-1 block text-sm leading-snug text-[var(--subtle)]">{c.items}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

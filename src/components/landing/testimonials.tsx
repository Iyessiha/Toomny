import Image from "next/image";
import type { Locale } from "@/i18n/dictionaries";

type Testimonial = {
  name: string;
  role: string;
  country: string;
  flag: string;
  photo: string;
  stars: number;
  quote: string;
};

const TESTIMONIALS_FR: Testimonial[] = [
  {
    name: "Kofi Mensah",
    role: "Développeur web freelance",
    country: "Côte d'Ivoire",
    flag: "🇨🇮",
    photo: "/images/hero-provider.jpg",
    stars: 5,
    quote:
      "En 3 mois sur Toomny, mes revenus ont triplé. Le paiement sécurisé via Wave me donne une vraie tranquillité d'esprit. Mes clients savent que leur argent est protégé jusqu'à la livraison.",
  },
  {
    name: "Fatou Diallo",
    role: "Responsable marketing",
    country: "Sénégal",
    flag: "🇸🇳",
    photo: "/images/testimonial-woman.jpg",
    stars: 5,
    quote:
      "J'ai trouvé un graphiste exceptionnel en moins de 24h. La vérification KYC m'a rassurée dès le départ. Je recommande Toomny à toutes les entreprises qui cherchent des talents africains sérieux.",
  },
  {
    name: "Ibrahim Traoré",
    role: "Community manager",
    country: "Burkina Faso",
    flag: "🇧🇫",
    photo: "/images/testimonial-man.jpg",
    stars: 5,
    quote:
      "Toomny m'a permis de toucher des clients bien au-delà de mon quartier. Aujourd'hui je travaille pour des entreprises à Abidjan, Dakar et Lomé. La plateforme change vraiment la donne.",
  },
];

const TESTIMONIALS_EN: Testimonial[] = [
  {
    name: "Kofi Mensah",
    role: "Freelance web developer",
    country: "Côte d'Ivoire",
    flag: "🇨🇮",
    photo: "/images/hero-provider.jpg",
    stars: 5,
    quote:
      "In 3 months on Toomny, my income tripled. Secure payment via Wave gives me real peace of mind. My clients know their money is protected until delivery.",
  },
  {
    name: "Fatou Diallo",
    role: "Marketing manager",
    country: "Senegal",
    flag: "🇸🇳",
    photo: "/images/testimonial-woman.jpg",
    stars: 5,
    quote:
      "I found an exceptional graphic designer in under 24 hours. The KYC verification reassured me from the start. I recommend Toomny to any business looking for serious African talent.",
  },
  {
    name: "Ibrahim Traoré",
    role: "Community manager",
    country: "Burkina Faso",
    flag: "🇧🇫",
    photo: "/images/testimonial-man.jpg",
    stars: 5,
    quote:
      "Toomny allowed me to reach clients far beyond my city. Today I work with companies in Abidjan, Dakar and Lomé. This platform is truly a game-changer.",
  },
];

function Stars({ n }: { n: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24" aria-hidden>
          <path
            fill={i < n ? "#FFCB00" : "#e2e8f0"}
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z"
          />
        </svg>
      ))}
    </div>
  );
}

export function Testimonials({ locale = "fr" }: { locale?: Locale }) {
  const list = locale === "en" ? TESTIMONIALS_EN : TESTIMONIALS_FR;
  const label = locale === "en" ? "What they say" : "Ce qu'ils en disent";
  const eyebrow = locale === "en" ? "Testimonials" : "Témoignages";

  return (
    <section className="border-t border-[var(--border)]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="text-center" data-reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-brand-600)]">
            {eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">{label}</h2>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((t, i) => (
            <article
              key={t.name}
              data-reveal
              style={{ transitionDelay: `${i * 60}ms` }}
              className="flex flex-col gap-5 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/[0.06]"
            >
              {/* Quote mark */}
              <svg width="28" height="22" viewBox="0 0 28 22" fill="none" aria-hidden className="shrink-0 text-[var(--color-brand-200)]">
                <path d="M0 22V13.818C0 9.015 1.572 5.26 4.716 2.552 7.86.85 11.288.001 15 0v4.364c-2.429.121-4.429.97-6 2.546C7.43 8.485 6.643 10.424 6.643 12.727H12V22H0Zm16 0V13.818c0-4.803 1.572-8.558 4.716-11.266C23.86.85 27.288.001 31 0v4.364c-2.429.121-4.429.97-6 2.546-1.571 1.575-2.357 3.514-2.357 5.817H28V22H16Z" fill="currentColor"/>
              </svg>

              {/* Quote text */}
              <p className="flex-1 text-sm leading-relaxed text-[var(--subtle)]">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Stars */}
              <Stars n={t.stars} />

              {/* Author */}
              <div className="flex items-center gap-3 border-t border-[var(--border)] pt-4">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full">
                  <Image
                    src={t.photo}
                    alt={t.name}
                    fill
                    className="object-cover object-top"
                    sizes="44px"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-[var(--subtle)]">
                    {t.flag} {t.role} · {t.country}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

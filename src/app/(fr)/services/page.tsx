import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { getCategories, getServices, categoryName } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = {
  title: "Catalogue des prestations",
  description:
    "Trouvez un prestataire vérifié en Afrique de l'Ouest. Prix affiché, délai annoncé, fonds bloqués jusqu'à la livraison.",
};

export const revalidate = 60;

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string }>;
}) {
  const { categorie } = await searchParams;
  const [categories, services] = await Promise.all([getCategories(), getServices(categorie)]);
  const active = categories.find((c) => c.slug === categorie);

  return (
    <>
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
            {active ? categoryName(active, "fr") : "Catalogue des prestations"}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-[var(--subtle)]">
            Prix affiché, délai annoncé. Vous payez en mobile money et les fonds restent bloqués
            jusqu&apos;à ce que vous validiez la livraison.
          </p>
        </div>

        {/* Filtres par catégorie */}
        <nav className="mt-8 flex flex-wrap gap-2" aria-label="Filtrer par catégorie">
          <Link
            href="/services"
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              !categorie
                ? "border-[var(--color-brand-500)] bg-[var(--color-brand-500)] text-white"
                : "border-[var(--border)] text-[var(--subtle)] hover:border-[var(--color-brand-300)] hover:text-[var(--foreground)]"
            }`}
          >
            Toutes
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/services?categorie=${c.slug}`}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                categorie === c.slug
                  ? "border-[var(--color-brand-500)] bg-[var(--color-brand-500)] text-white"
                  : "border-[var(--border)] text-[var(--subtle)] hover:border-[var(--color-brand-300)] hover:text-[var(--foreground)]"
              }`}
            >
              {categoryName(c, "fr")}
            </Link>
          ))}
        </nav>

        {services.length > 0 ? (
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <li
                key={s.id}
                className="group flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-brand-300)] hover:shadow-lg hover:shadow-black/[0.04]"
              >
                <h2 className="font-display text-base font-bold leading-snug">{s.title}</h2>
                <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-[var(--subtle)]">
                  {s.description}
                </p>
                <div className="mt-5 flex items-end justify-between border-t border-[var(--border)] pt-4">
                  <div>
                    <p className="text-xs text-[var(--subtle)]">
                      {s.provider?.display_name ?? "Prestataire"}
                      {s.provider?.country_code ? ` · ${s.provider.country_code}` : ""}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--subtle)]">
                      Livraison en {s.delivery_days} jour{s.delivery_days > 1 ? "s" : ""}
                    </p>
                  </div>
                  <p className="font-display text-base font-bold text-[var(--color-brand-600)]">
                    {formatMoney(BigInt(s.price_minor), s.currency, "fr")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          /* État vide assumé : le catalogue démarre. Mieux vaut le dire
             clairement et inviter à le remplir que simuler une activité. */
          <div className="mt-12 rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-16 text-center">
            <h2 className="font-display text-xl font-bold">
              {active ? "Aucune prestation dans cette catégorie" : "Le catalogue ouvre bientôt"}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--subtle)]">
              Nous ouvrons métier par métier, pour que chaque catégorie soit réellement fournie le
              jour où vous la cherchez. Vous proposez ce service ? Publiez-le dès maintenant et
              soyez parmi les premiers référencés.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href="/auth?role=provider"
                className="rounded-full bg-[var(--color-brand-500)] px-6 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.03] active:scale-95"
              >
                Publier une prestation
              </Link>
              {active && (
                <Link
                  href="/services"
                  className="rounded-full border border-[var(--border)] px-6 py-3 text-sm font-semibold transition-colors hover:bg-[var(--background)]"
                >
                  Voir toutes les catégories
                </Link>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}

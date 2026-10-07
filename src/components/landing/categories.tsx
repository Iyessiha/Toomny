const CATEGORIES = [
  { name: "Design graphique", items: "Logo, flyer, charte, packaging" },
  { name: "Développement web", items: "Site vitrine, e-commerce, application" },
  { name: "Community management", items: "Publications, modération, calendrier" },
  { name: "Montage vidéo", items: "Réels, publicités, sous-titrage" },
  { name: "Rédaction & traduction", items: "Articles, fiches produit, français-anglais" },
  { name: "Marketing digital", items: "Publicités Meta et TikTok, référencement" },
  { name: "Comptabilité & admin", items: "Saisie, facturation, assistance" },
  { name: "Photographie", items: "Produit, événement, portrait" },
];

export function Categories() {
  return (
    <section id="categories" className="border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div data-reveal className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-brand-600)]">
            Catégories
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
            Les métiers dont les entreprises d&apos;ici ont besoin
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-[var(--subtle)]">
            Nous ouvrons progressivement, métier par métier, pour que chaque catégorie soit
            réellement fournie le jour où vous la cherchez.
          </p>
        </div>

        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((c, i) => (
            <a
              key={c.name}
              href="/services"
              data-reveal
              style={{ transitionDelay: `${(i % 4) * 50}ms` }}
              className="group rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-brand-300)] hover:shadow-lg hover:shadow-black/[0.04]"
            >
              <h3 className="font-display text-base font-bold">{c.name}</h3>
              <p className="mt-1.5 text-sm text-[var(--subtle)]">{c.items}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-brand-600)]">
                Explorer
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="transition-transform duration-300 group-hover:translate-x-1"
                >
                  <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Le séquestre est l'argument central des deux côtés du marché. Il est présenté
 * tel qu'il fonctionne réellement : les fonds sont portés par un partenaire
 * agréé, jamais par Toomny — c'est à la fois la contrainte réglementaire et
 * la meilleure garantie que nous puissions offrir.
 */
const GUARANTEES = [
  {
    title: "Les fonds ne transitent pas par nous",
    body: "L'argent du client est conservé par un établissement agréé pour détenir des fonds. Toomny déclenche la libération, mais ne touche jamais au dépôt.",
  },
  {
    title: "Identité vérifiée des deux côtés",
    body: "Pièce d'identité, numéro mobile money et références contrôlés. Notre vérification est pensée pour les pièces locales, pas pour les recaler.",
  },
  {
    title: "Litige arbitré rapidement",
    body: "En cas de désaccord, un humain tranche à partir des échanges et des livrables conservés sur la plateforme. En français, sans attendre des semaines.",
  },
  {
    title: "Validation automatique sous 72 h",
    body: "Si le client ne valide pas une livraison conforme, le paiement part quand même. Un client inactif ne bloque pas le revenu d'un prestataire.",
  },
];

export function Security() {
  return (
    <section id="securite" className="border-t border-[var(--border)]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div data-reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-brand-600)]">
              Sécurité
            </p>
            <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
              Votre argent est bloqué, pas confié
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-[var(--subtle)]">
              La confiance ne se décrète pas sur une page d&apos;accueil. Elle vient du fait que
              ni le client ni le prestataire n&apos;a besoin de faire confiance à l&apos;autre.
            </p>

            <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-6">
              <p className="font-display text-sm font-bold text-[var(--color-brand-700)]">
                Le parcours d&apos;un paiement
              </p>
              <ol className="mt-4 space-y-3 text-sm text-[var(--subtle)]">
                {[
                  "Le client paie en mobile money",
                  "Les fonds sont bloqués chez le partenaire agréé",
                  "Le prestataire livre",
                  "Validation, puis versement sous 24 h",
                ].map((s, i) => (
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

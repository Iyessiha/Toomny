const QUESTIONS = [
  {
    q: "Faut-il créer une société américaine pour être payé ?",
    a: "Non. C'est précisément ce que Toomny évite. Vous êtes payé en tant que personne, sur votre compte mobile money, dans votre pays. Aucune LLC, aucun EIN, aucun compte Payoneer.",
  },
  {
    q: "Quels moyens de paiement acceptez-vous ?",
    a: "Wave, Orange Money, MTN MoMo et Moov Money, en FCFA. Nous ouvrons d'autres canaux au fur et à mesure de notre extension en Afrique de l'Ouest.",
  },
  {
    q: "Qui détient l'argent pendant la mission ?",
    a: "Un établissement agréé pour la détention de fonds, partenaire de Toomny. Nous n'avons jamais les fonds sur nos propres comptes : nous ne faisons que déclencher leur libération une fois le travail validé.",
  },
  {
    q: "Combien ça coûte ?",
    a: "10 % sur le montant de la mission, prélevés côté prestataire. Rien côté client, ni à l'inscription, ni pour postuler, ni pour publier une prestation.",
  },
  {
    q: "Que se passe-t-il si le travail ne convient pas ?",
    a: "Vous ouvrez un litige avant de valider. Un arbitre humain tranche à partir des échanges et des livrables conservés sur la plateforme, et les fonds sont libérés ou rendus en conséquence.",
  },
  {
    q: "Dans quels pays Toomny est-il disponible ?",
    a: "Nous démarrons en Afrique de l'Ouest francophone, puis nous ouvrons aux marchés anglophones de la région. La plateforme est bilingue français-anglais dès maintenant.",
  },
];

export function Faq() {
  return (
    <section className="border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-28">
        <h2 data-reveal className="text-3xl font-bold leading-tight sm:text-4xl">
          Questions fréquentes
        </h2>

        <div className="mt-10 divide-y divide-[var(--border)] border-y border-[var(--border)]">
          {QUESTIONS.map((item) => (
            <details key={item.q} data-reveal className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-base font-semibold [&::-webkit-details-marker]:hidden">
                {item.q}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="shrink-0 text-[var(--color-brand-500)] transition-transform duration-300 group-open:rotate-45"
                >
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

/**
 * Comparaison de frais. Tous les chiffres sont vérifiables et sourcés sous le
 * tableau : c'est la preuve la plus forte dont nous disposons avant d'avoir
 * des clients à citer, et la seule qui soit honnête à ce stade.
 */

const ROWS = [
  {
    label: "Commission prestataire",
    fiverr: "20 % fixe",
    upwork: "0 à 15 %, ~10 % en pratique",
    toomny: "10 %",
  },
  {
    label: "Frais côté client",
    fiverr: "~5,5 % + 3,50 $ sous 200 $",
    upwork: "3 à 5 %",
    toomny: "0 %",
  },
  {
    label: "Coût pour postuler",
    fiverr: "—",
    upwork: "Connects payants",
    toomny: "Gratuit",
  },
  {
    label: "Rapatriement de l'argent",
    fiverr: "Payoneer : 1 % + retrait + change",
    upwork: "Payoneer ou virement + change",
    toomny: "Mobile money, versement direct",
  },
  {
    label: "Délai pour être payé",
    fiverr: "Plusieurs jours",
    upwork: "Plusieurs jours",
    toomny: "Sous 24 h",
  },
];

export function Pricing() {
  return (
    <section id="tarifs" className="border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div data-reveal className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-brand-600)]">
            Tarifs
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
            Ce que les plateformes mondiales vous prennent vraiment
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-[var(--subtle)]">
            Entre la commission, les frais côté client et le coût du rapatriement, un prestataire
            africain perd couramment un quart à un tiers de ce qu&apos;il facture. Voici la
            comparaison, chiffre par chiffre.
          </p>
        </div>

        {/* Desktop : tableau. Mobile : cartes empilées, car un tableau à quatre
            colonnes est illisible sur 390 px. */}
        <div data-reveal className="mt-12 hidden overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] lg:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-6 py-5 font-medium text-[var(--subtle)]"> </th>
                <th className="px-6 py-5 font-display text-base font-bold">Fiverr</th>
                <th className="px-6 py-5 font-display text-base font-bold">Upwork</th>
                <th className="bg-[var(--color-brand-500)] px-6 py-5 font-display text-base font-bold text-white">
                  Toomny
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r, i) => (
                <tr key={r.label} className={i < ROWS.length - 1 ? "border-b border-[var(--border)]" : ""}>
                  <td className="px-6 py-5 font-medium">{r.label}</td>
                  <td className="px-6 py-5 text-[var(--subtle)]">{r.fiverr}</td>
                  <td className="px-6 py-5 text-[var(--subtle)]">{r.upwork}</td>
                  <td className="bg-[var(--color-brand-50)] px-6 py-5 font-semibold text-[var(--color-brand-700)]">
                    {r.toomny}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-10 grid gap-4 lg:hidden">
          {ROWS.map((r) => (
            <div key={r.label} data-reveal className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
              <p className="font-display font-bold">{r.label}</p>
              <dl className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--subtle)]">Fiverr</dt>
                  <dd className="text-right text-[var(--subtle)]">{r.fiverr}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--subtle)]">Upwork</dt>
                  <dd className="text-right text-[var(--subtle)]">{r.upwork}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-[var(--border)] pt-1.5">
                  <dt className="font-semibold text-[var(--color-brand-700)]">Toomny</dt>
                  <dd className="text-right font-semibold text-[var(--color-brand-700)]">{r.toomny}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>

        <p data-reveal className="mt-6 text-xs leading-relaxed text-[var(--subtle)]">
          Grilles relevées en octobre 2026 sur les barèmes publics de{" "}
          <a
            href="https://www.jobbers.io/?p=53038"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            Fiverr et Upwork
          </a>{" "}
          et sur les{" "}
          <a
            href="https://vaultleap.com/blog/payoneer-fees-explained-2026"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            frais Payoneer
          </a>
          . Les conditions de ces plateformes peuvent changer.
        </p>
      </div>
    </section>
  );
}

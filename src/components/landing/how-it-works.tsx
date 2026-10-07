"use client";

import { useState } from "react";

const FLOWS = {
  client: {
    label: "Je recrute",
    steps: [
      {
        title: "Choisissez une prestation",
        body: "Parcourez le catalogue : chaque prestation affiche son prix et son délai. Pas de cahier des charges à rédiger, pas d'appel d'offres à gérer.",
      },
      {
        title: "Payez, l'argent est bloqué",
        body: "Vous réglez en FCFA par mobile money. Les fonds sont conservés par notre partenaire agréé : le prestataire sait qu'il sera payé, vous gardez la main.",
      },
      {
        title: "Validez la livraison",
        body: "Le travail livré vous convient, vous validez et les fonds partent. Un problème ? Vous ouvrez un litige, arbitré en français, sans délai interminable.",
      },
    ],
  },
  provider: {
    label: "Je travaille",
    steps: [
      {
        title: "Publiez vos prestations",
        body: "Vous décrivez ce que vous savez faire, à quel prix et en combien de temps. La publication et les candidatures sont gratuites.",
      },
      {
        title: "Travaillez l'esprit tranquille",
        body: "Vous ne commencez que lorsque l'argent du client est déjà bloqué. Fini les relances et les impayés sur un travail déjà livré.",
      },
      {
        title: "Recevez sous 24 h",
        body: "Dès validation, vous êtes payé sur votre Wave ou votre Orange Money. Sans société américaine, sans Payoneer, sans frais de change.",
      },
    ],
  },
} as const;

type Key = keyof typeof FLOWS;

export function HowItWorks() {
  const [key, setKey] = useState<Key>("client");
  const flow = FLOWS[key];

  return (
    <section id="fonctionnement" className="border-t border-[var(--border)]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div data-reveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-brand-600)]">
              Fonctionnement
            </p>
            <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
              Trois étapes, et personne ne se fait avoir
            </h2>
          </div>

          <div className="inline-flex shrink-0 rounded-full border border-[var(--border)] bg-[var(--background)] p-1 text-sm">
            {(Object.keys(FLOWS) as Key[]).map((k) => (
              <button
                key={k}
                onClick={() => setKey(k)}
                aria-pressed={key === k}
                className={`rounded-full px-5 py-2 font-medium transition-colors duration-200 ${
                  key === k
                    ? "bg-[var(--color-brand-500)] text-white"
                    : "text-[var(--subtle)] hover:text-[var(--foreground)]"
                }`}
              >
                {FLOWS[k].label}
              </button>
            ))}
          </div>
        </div>

        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {flow.steps.map((s, i) => (
            <li
              key={s.title}
              data-reveal
              style={{ transitionDelay: `${i * 80}ms` }}
              className="group relative rounded-2xl border border-[var(--border)] bg-[var(--background)] p-7 transition-colors duration-300 hover:border-[var(--color-brand-300)]"
            >
              <span className="font-display text-5xl font-extrabold text-[var(--color-brand-100)] transition-colors duration-300 group-hover:text-[var(--color-brand-200)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-[var(--subtle)]">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { SiteHeader } from "@/components/ui/site-header";

// Page d'accueil — structure de marque posée.
// Le discours définitif et le trio de métiers à ouvrir sortent des 50
// entretiens de la Phase 0, pas d'une hypothèse.

const PROMISES = [
  {
    audience: "Pour le prestataire",
    title: "Tu gardes 90 % de ce que tu factures",
    body: "Payé sous 24 h sur ton Wave ou ton Orange Money. Sans LLC américaine, sans Payoneer, sans perdre un tiers de ton revenu en frais.",
  },
  {
    audience: "Pour l'entreprise",
    title: "Ton argent reste bloqué jusqu'à la livraison",
    body: "Tu paies en FCFA par mobile money, les fonds sont conservés par notre partenaire agréé, et tu les libères quand le travail est livré.",
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4">
        <section className="flex flex-col items-start gap-6 py-16 sm:py-24">
          <span className="text-[var(--color-brand-500)]">
            <Logo size={56} withWordmark={false} />
          </span>

          <div className="space-y-4">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Travailler ensemble,
              <br />
              grandir ensemble.
            </h1>
            <p className="max-w-xl text-base text-[var(--subtle)] sm:text-lg">
              Toomny connecte les entreprises d&apos;Afrique de l&apos;Ouest aux prestataires du
              continent. Paiement en mobile money, fonds sécurisés jusqu&apos;à la livraison.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/services"
              className="rounded-full bg-[var(--color-brand-500)] px-6 py-3 text-sm font-medium text-white"
            >
              Trouver un prestataire
            </Link>
            <Link
              href="/auth"
              className="rounded-full border border-[var(--border)] px-6 py-3 text-sm font-medium"
            >
              Proposer mes services
            </Link>
          </div>
        </section>

        <section className="grid gap-4 pb-16 sm:grid-cols-2">
          {PROMISES.map((p) => (
            <div
              key={p.audience}
              className="rounded-2xl bg-[var(--surface)] p-6"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-brand-600)]">
                {p.audience}
              </p>
              <h2 className="mt-2 text-lg font-semibold">{p.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--subtle)]">{p.body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-[var(--border)]">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-8 text-sm text-[var(--subtle)]">
          <span className="text-[var(--color-brand-500)]">
            <Logo size={22} />
          </span>
          <p>Travailler ensemble, grandir ensemble.</p>
        </div>
      </footer>
    </>
  );
}

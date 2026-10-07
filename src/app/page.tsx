import Link from "next/link";

// Page d'accueil — placeholder structurel.
// Le contenu réel attend les 50 entretiens de la Phase 0 : le trio de métiers
// à ouvrir et le discours de la page sortent de là, pas d'une hypothèse.

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-8 px-4 py-16">
      <div className="space-y-3">
        <p className="text-sm font-medium tracking-wide text-[var(--color-brand-600)]">Toomny</p>
        <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
          Le talent africain, payé chez lui.
        </h1>
        <p className="text-base text-[var(--color-muted)]">
          Les PME d&apos;Afrique de l&apos;Ouest recrutent des prestataires du continent. Paiement
          en mobile money, fonds sécurisés jusqu&apos;à la livraison, versement sous 24 h.
        </p>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-black/10 p-4">
          <dt className="text-sm font-medium">Prestataire</dt>
          <dd className="mt-1 text-sm text-[var(--color-muted)]">
            Tu gardes 90 % de ce que tu factures, payé sous 24 h sur ton mobile money.
          </dd>
        </div>
        <div className="rounded-lg border border-black/10 p-4">
          <dt className="text-sm font-medium">Client</dt>
          <dd className="mt-1 text-sm text-[var(--color-muted)]">
            Ton argent reste bloqué jusqu&apos;à la livraison. Zéro frais côté client.
          </dd>
        </div>
      </dl>

      <p className="text-sm text-[var(--color-muted)]">
        <Link href="/services" className="underline underline-offset-4">
          Parcourir le catalogue
        </Link>
      </p>
    </main>
  );
}

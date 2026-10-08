import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Conditions d'utilisation" };

/**
 * Page provisoire : les CGU doivent être rédigées et validées par un juriste
 * avant publication (point ouvert du README). Le lien d'inscription pointe ici.
 */
export default function CguPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-2xl font-bold">Conditions d&apos;utilisation</h1>
      <p className="mt-4 text-sm leading-relaxed text-[var(--subtle)]">
        Les conditions d&apos;utilisation de Toomny sont en cours de rédaction. Elles seront publiées
        ici avant l&apos;ouverture des paiements.
      </p>
      <p className="mt-8 text-sm">
        <Link href="/" className="underline underline-offset-4">Retour à l&apos;accueil</Link>
      </p>
    </main>
  );
}

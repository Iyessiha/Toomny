import Link from "next/link";
import { Logo } from "@/components/ui/logo";

const COLUMNS = [
  {
    title: "Plateforme",
    links: [
      { label: "Catégories", href: "#categories" },
      { label: "Comment ça marche", href: "#fonctionnement" },
      { label: "Tarifs", href: "#tarifs" },
      { label: "Sécurité", href: "#securite" },
    ],
  },
  {
    title: "Prestataires",
    links: [
      { label: "Proposer mes services", href: "/auth" },
      { label: "Être payé en mobile money", href: "#tarifs" },
      { label: "Tableau de bord", href: "/dashboard" },
    ],
  },
  {
    title: "Entreprises",
    links: [
      { label: "Trouver un prestataire", href: "/services" },
      { label: "Mes commandes", href: "/orders" },
      { label: "Litiges", href: "/disputes" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <span className="inline-flex text-[var(--color-brand-500)]">
              <Logo size={28} />
            </span>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--subtle)]">
              La marketplace de talents d&apos;Afrique de l&apos;Ouest. Paiement en mobile money,
              fonds sécurisés jusqu&apos;à la livraison.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="font-display text-sm font-bold">{col.title}</p>
              <ul className="mt-4 space-y-2.5 text-sm">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-[var(--subtle)] transition-colors hover:text-[var(--foreground)]">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-[var(--border)] pt-6 text-xs text-[var(--subtle)] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Toomny by MonWe Infinity LLC</p>
          <p>Travailler ensemble, grandir ensemble.</p>
        </div>
      </div>
    </footer>
  );
}

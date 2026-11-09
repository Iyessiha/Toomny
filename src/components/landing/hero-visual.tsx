import { BadgeCheck, Landmark, Scale, Smartphone, Wallet } from "lucide-react";
import type { Locale } from "@/i18n/dictionaries";

type Mode = "client" | "provider";

/**
 * Panneau marketing du hero : trois promesses concrètes par parcours.
 * Aucune donnée inventée (prestataires, notes, chiffres de ventes) : seulement
 * des engagements de la plateforme, repris de la page tarifs et des garanties.
 */
const COPY = {
  fr: {
    client: {
      title: "Commandez en toute confiance",
      points: [
        { icon: Landmark, title: "Paiement conservé", body: "Votre argent est retenu jusqu'à ce que vous validiez la livraison, dès l'ouverture des paiements." },
        { icon: Wallet, title: "0 % de commission pour vous", body: "Le prix affiché est le prix payé. Les frais de paiement mobile money (2,5 % + 100 FCFA) sont indiqués avant validation." },
        { icon: Scale, title: "Litige tranché par un humain", body: "Un arbitre décide à partir des échanges et des livrables conservés sur la plateforme." },
      ],
    },
    provider: {
      title: "Gagnez votre argent, simplement",
      points: [
        { icon: Wallet, title: "Commission de 3 à 10 %", body: "Selon votre plan, du plan gratuit au plan Expert. Vous voyez le montant net avant chaque commande." },
        { icon: Smartphone, title: "Payé par mobile money", body: "Wave, Orange Money, MTN MoMo ou Moov Money. Pas de compte américain, pas de Payoneer." },
        { icon: BadgeCheck, title: "Une identité vérifiée", body: "Une pièce d'identité contrôlée avant publication : vos clients savent à qui ils ont affaire." },
      ],
    },
  },
  en: {
    client: {
      title: "Order with confidence",
      points: [
        { icon: Landmark, title: "Payment held", body: "Your money is held until you approve the delivery, once payments open." },
        { icon: Wallet, title: "0% commission for you", body: "The price shown is the price you pay. Mobile money fees (2.5% + 100 XOF) are shown before you confirm." },
        { icon: Scale, title: "Disputes settled by a person", body: "An arbitrator decides from the messages and deliverables kept on the platform." },
      ],
    },
    provider: {
      title: "Get paid, simply",
      points: [
        { icon: Wallet, title: "Commission of 3% to 10%", body: "Depending on your plan, from the free plan to Expert. You see the net amount before each order." },
        { icon: Smartphone, title: "Paid by mobile money", body: "Wave, Orange Money, MTN MoMo or Moov Money. No US company, no Payoneer." },
        { icon: BadgeCheck, title: "A verified identity", body: "A checked ID document before you publish: your clients know who they are working with." },
      ],
    },
  },
} as const;

export function HeroVisual({ locale = "fr", mode = "client" }: { locale?: Locale; mode?: Mode }) {
  const t = COPY[locale === "en" ? "en" : "fr"][mode];
  return (
    <div className="w-full max-w-[380px] rounded-3xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-[var(--shadow-xl)] sm:p-7">
      <p className="font-display text-xl font-extrabold tracking-tight text-[var(--brand-text-1)]">{t.title}</p>
      <ul className="mt-5 space-y-5">
        {t.points.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex gap-3.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--surface)] text-[var(--brand-text-1)]">
              <Icon size={18} aria-hidden />
            </span>
            <div>
              <p className="text-sm font-bold">{title}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-[var(--subtle)]">{body}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

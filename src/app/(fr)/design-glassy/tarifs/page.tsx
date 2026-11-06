import type { Metadata } from "next";
import Link from "next/link";
import { Check, Minus, Sparkles } from "lucide-react";
import { getLanding } from "@/content/landing";
import { visitorLocale } from "@/i18n/server-locale";
import { GlassyShell, GlassyContextBar } from "../glassy-shell";

/**
 * Page tarifs de la maquette « Aurora Glass ».
 *
 * Les tarifs quittent la page d'accueil : la landing reste marketing (visages,
 * preuves, métiers), et le prix se lit ici, en entier, sans être noyé dans un
 * défilement de dix sections. C'est aussi la page que l'on indexe sur les
 * requêtes « tarifs », « commission », ce que la landing ne faisait pas.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tarifs — proposition Aurora Glass",
  robots: { index: false, follow: false },
};

export default async function TarifsPage() {
  const locale = await visitorLocale();
  const t = getLanding(locale).pricing;
  const fr = locale === "fr";

  const plans = t.plans;
  const commissionRows = t.rows;

  return (
    <GlassyShell>
      <GlassyContextBar
        label={fr ? "Proposition · tarifs" : "Proposal · pricing"}
        links={[
          { href: "/design-glassy", label: fr ? "← La vitrine" : "← Landing" },
          { href: "/", label: fr ? "Design actuel" : "Current design" },
        ]}
      />

      <main className="mx-auto max-w-5xl px-4 pb-20 pt-12 sm:px-6 sm:pt-16">
        {/* ── En-tête ───────────────────────────────────────────────────── */}
        <header data-g-reveal>
          <span className="g-eyebrow">{t.eyebrow}</span>
          <h1 className="g-display mt-4 text-3xl font-extrabold text-white sm:text-4xl">
            {fr ? "Ce que ça coûte, sans astérisque" : "What it costs, no asterisk"}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/65 sm:text-base">
            {fr
              ? "Côté client, Toomny ne prend rien. Côté prestataire, la commission baisse à mesure que le plan monte. Les frais de paiement mobile money sont affichés avant chaque paiement, jamais après."
              : "Buyers pay Toomny nothing. On the provider side, the commission drops as the plan goes up. Mobile money fees are shown before every payment, never after."}
          </p>
        </header>

        {/* ── Bandeau 0 % client ────────────────────────────────────────── */}
        <section
          data-g-reveal
          className="glass glass-edge glass-solid g-round-lg relative mt-8 overflow-hidden p-6 sm:p-8"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{ background: "radial-gradient(60% 90% at 100% 0%, rgba(51,209,122,0.32), transparent 70%)" }}
          />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
            <p className="font-display text-[clamp(56px,12vw,96px)] font-black leading-none tracking-[-0.05em] text-[#9ff2c2] tabular-nums">
              0<span className="ml-1 align-top text-[0.42em] text-[#8bf0b6]">%</span>
            </p>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#9ff2c2]">
                {t.clientKicker}
              </p>
              <h2 className="mt-1 text-xl font-extrabold leading-tight text-white sm:text-2xl">
                {fr ? "Nous ne prenons rien sur vos commandes." : "We take nothing from your orders."}
              </h2>
              <p className="mt-2 max-w-lg text-xs leading-relaxed text-white/70 sm:text-sm">
                {t.clientBody}
              </p>
            </div>
          </div>
        </section>

        {/* ── Plans prestataires ────────────────────────────────────────── */}
        <section className="mt-12">
          <h2 className="g-display text-xl font-extrabold text-white sm:text-2xl" data-g-reveal>
            {fr ? "Pour les prestataires" : "For providers"}
          </h2>
          <p className="mt-1 text-xs text-white/55" data-g-reveal>
            {fr
              ? "Sans engagement. Le plan change quand vous voulez, la commission suit."
              : "No commitment. Change plan whenever you want, the commission follows."}
          </p>

          <div className="g-grid-plans mt-5">
            {plans.map((p) => (
              <div
                key={p.name}
                data-g-reveal
                className={`glass glass-edge glass-specular g-round-md relative flex flex-col p-4 ${
                  p.highlight ? "g-ring-accent" : ""
                }`}
                style={
                  p.highlight
                    ? { boxShadow: "inset 0 1px 0 rgba(255,255,255,.3), 0 24px 55px -30px rgba(51,209,122,.6)" }
                    : undefined
                }
              >
                {p.badge && (
                  <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 rounded-full border border-[#8bf0b6]/50 bg-[#07231a] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#9ff2c2]">
                    <Sparkles width={8} height={8} aria-hidden />
                    {p.badge}
                  </span>
                )}
                <p className="text-sm font-bold text-white">{p.name}</p>
                <p className="mt-2 font-display text-xl font-extrabold text-white">{p.price}</p>
                {p.priceNote && <p className="text-[10px] text-white/55">{p.priceNote}</p>}

                <p className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-3xl font-extrabold text-[#8bf0b6]">{p.commission}</span>
                  <span className="text-[10px] text-white/60">{fr ? "de commission" : "commission"}</span>
                </p>

                <hr className="g-hairline my-3" />

                <ul className="flex-1 space-y-1.5 text-[11px] text-white/70">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5">
                      <Check width={11} height={11} className="mt-0.5 shrink-0 text-[#8bf0b6]" aria-hidden />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={p.href}
                  className={`g-btn g-btn-sm mt-4 w-full ${p.highlight ? "g-btn-primary" : "g-btn-ghost"}`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ── Le calcul en clair ────────────────────────────────────────── */}
        <section className="mt-12" data-g-reveal>
          <h2 className="g-display text-xl font-extrabold text-white sm:text-2xl">
            {fr ? "Où part chaque franc" : "Where each franc goes"}
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-white/60">
            {fr
              ? "Exemple sur une commande de 100 000 FCFA au plan Pro. Aucun frais caché, aucune ligne découverte au moment du versement."
              : "Example on a 100,000 FCFA order on the Pro plan. No hidden fee, no line discovered at payout time."}
          </p>

          <div className="glass glass-edge g-round-md mt-4 overflow-hidden">
            <table className="w-full text-left text-xs">
              <tbody className="text-white/70">
                {[
                  { label: fr ? "Le client paie" : "The client pays", value: "100 000 FCFA", strong: true },
                  { label: fr ? "Commission Toomny (5 %)" : "Toomny commission (5%)", value: "− 5 000 FCFA" },
                  { label: fr ? "Frais de versement mobile money (1 %)" : "Mobile money payout fee (1%)", value: "− 950 FCFA" },
                  { label: fr ? "Le prestataire reçoit" : "The provider receives", value: "94 050 FCFA", strong: true, accent: true },
                ].map((r) => (
                  <tr key={r.label} className="border-b border-white/10 last:border-0">
                    <th scope="row" className={`px-4 py-2.5 font-semibold ${r.strong ? "text-white" : "text-white/70"}`}>
                      {r.label}
                    </th>
                    <td className={`px-4 py-2.5 text-right font-display font-bold ${r.accent ? "text-[#9ff2c2]" : "text-white"}`}>
                      {r.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Comparatif ────────────────────────────────────────────────── */}
        <section className="mt-12" data-g-reveal>
          <h2 className="g-display text-xl font-extrabold text-white sm:text-2xl">{t.compareTitle}</h2>
          <p className="mt-1 text-xs text-white/60">
            {fr
              ? "Relevé sur les barèmes publics de Fiverr, ComeUp et Payoneer en octobre 2026."
              : "Recorded from public Fiverr, ComeUp and Payoneer rate cards in October 2026."}
          </p>

          <div className="glass glass-edge g-round-md mt-4 overflow-hidden">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="text-[9px] uppercase tracking-wider text-white/55">
                  <th className="px-4 py-2.5 font-semibold">{fr ? "Prestataire" : "Provider"}</th>
                  <th className="px-2 py-2.5 font-semibold">Fiverr</th>
                  <th className="px-2 py-2.5 font-semibold">Upwork</th>
                  <th className="px-4 py-2.5 font-semibold text-[#9ff2c2]">Toomny</th>
                </tr>
              </thead>
              <tbody className="text-white/70">
                {commissionRows.map((r) => (
                  <tr key={r.label} className="border-t border-white/10">
                    <th scope="row" className="px-4 py-2.5 font-semibold text-white/85">{r.label}</th>
                    <td className="px-2 py-2.5">{r.fiverr}</td>
                    <td className="px-2 py-2.5">{r.upwork}</td>
                    <td className="px-4 py-2.5 font-semibold text-[#9ff2c2]">{r.toomny}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 flex items-start gap-1.5 text-[10px] leading-relaxed text-white/45">
            <Minus width={10} height={10} className="mt-0.5 shrink-0" aria-hidden />
            {t.sourcesPrefix}
            {t.sourceA}
            {t.sourcesMid}
            {t.sourceB}
            {t.sourcesSuffix}
          </p>
        </section>

        {/* ── Questions de prix ─────────────────────────────────────────── */}
        <section className="mt-12">
          <h2 className="g-display text-xl font-extrabold text-white sm:text-2xl" data-g-reveal>
            {fr ? "Les questions qu'on nous pose sur le prix" : "Questions we get about price"}
          </h2>
          <div className="mt-4 space-y-2">
            {t.howSteps.map((step, i) => (
              <div key={step} data-g-reveal className="glass glass-edge g-round-sm flex gap-3 p-3.5">
                <span className="font-display text-lg font-extrabold text-white/25">{String(i + 1).padStart(2, "0")}</span>
                <p className="text-[11px] leading-relaxed text-white/70">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-12 flex flex-wrap gap-3" data-g-reveal>
          <Link href="/design-glassy" className="g-btn g-btn-ghost g-btn-sm">
            {fr ? "← Retour à la vitrine" : "← Back to the landing"}
          </Link>
          <Link href="/design-glassy/dashboards?role=prestataire" className="g-btn g-btn-primary g-btn-sm">
            {fr ? "Voir le tableau de bord prestataire" : "See the provider dashboard"}
          </Link>
        </div>
      </main>
    </GlassyShell>
  );
}

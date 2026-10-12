import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Avatar,
  FilterTabs,
  MiniStat,
  Notice,
  Pill,
  ProStat,
  ProgressBar,
  QuickAction,
  Section,
  TableCard,
  disputeTone,
  kycTone,
  orderTone,
  payoutTone,
  roleTone,
  serviceTone,
  type Tone,
} from "@/components/dashboard/pro";

export const metadata: Metadata = { title: "Charte — kit premium" };

// Référence visuelle interne : elle ne dépend d'aucune donnée, ce qui permet de
// vérifier le rendu du kit (clair, sombre, mobile) sans base de données. En
// production, elle n'existe pas.
export default function ChartePage() {
  if (process.env.NODE_ENV === "production") notFound();

  const orders = ["pending_payment", "funded", "in_progress", "delivered", "completed", "disputed", "cancelled"];
  const payouts = ["queued", "processing", "paid", "failed"];
  const kyc = ["unverified", "pending", "manual_review", "verified", "rejected"];
  const disputes = ["open", "awaiting_client", "awaiting_provider", "resolved_client", "resolved_split"];
  const roles = ["client", "provider", "both", "admin"];
  const services = ["draft", "active", "paused", "removed"];
  const tones: Tone[] = ["success", "warning", "danger", "info", "neutral", "brand"];

  return (
    <div className="min-h-dvh bg-[var(--surface)]">
      <div className="hero-band relative overflow-hidden">
        <div className="texture-dots absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-5xl px-6 py-12">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-gold-300)]">
            Interne · hors production
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
            Kit <span className="gradient-text">premium</span> des espaces connectés
          </h1>
          <p className="hero-subtle mt-3 max-w-2xl text-sm leading-relaxed">
            Toutes les briques vivent dans <code>globals.css</code> et{" "}
            <code>components/dashboard/pro.tsx</code>. Les couleurs passent par des
            tokens : le mode sombre suit sans variante à écrire. Cette page sert à
            contrôler le rendu et à arbitrer avant d&apos;habiller une nouvelle page.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-6 px-6 py-10">
        <Section title="Pastilles de statut" subtitle="Un ton par sens, jamais une couleur en dur.">
          <div className="flex flex-wrap gap-2">
            {tones.map((t) => (
              <Pill key={t} tone={t}>
                {t}
              </Pill>
            ))}
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "Commandes", values: orders, tone: orderTone },
              { label: "Versements", values: payouts, tone: payoutTone },
              { label: "Vérifications", values: kyc, tone: kycTone },
              { label: "Litiges", values: disputes, tone: disputeTone },
              { label: "Rôles", values: roles, tone: roleTone },
              { label: "Prestations", values: services, tone: serviceTone },
            ].map((group) => (
              <div key={group.label}>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--subtle)]">
                  {group.label}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {group.values.map((v) => (
                    <Pill key={v} tone={group.tone(v)}>
                      {v}
                    </Pill>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Boutons" subtitle="btn-primary, btn-gold, btn-secondary, btn-ghost, puis les engagements.">
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="btn-primary">
              Action principale
            </button>
            <button type="button" className="btn-gold">
              Action or
            </button>
            <button type="button" className="btn-secondary">
              Secondaire
            </button>
            <button type="button" className="btn-ghost">
              Discrète
            </button>
            <button type="button" className="btn-success">
              Valider
            </button>
            <button type="button" className="btn-warn">
              Forcer
            </button>
            <button type="button" className="btn-danger">
              Rejeter
            </button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" className="btn-primary btn-sm">
              Compacte
            </button>
            <button type="button" className="btn-ghost btn-sm">
              Compacte discrète
            </button>
            <button type="button" className="btn-danger btn-sm">
              Compacte destructive
            </button>
          </div>
        </Section>

        <Section title="Puces de filtre et champs" subtitle="Des liens, pas de JavaScript : l'état vient de l'URL.">
          <FilterTabs
            className="mb-0"
            items={[
              { href: "/charte", label: "Actives", current: true, count: 12 },
              { href: "/charte?tab=all", label: "Toutes", current: false, count: 240 },
              { href: "/charte?tab=draft", label: "Brouillons", current: false },
            ]}
          />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <input className="input" placeholder="Champ de saisie" />
            <input className="input" placeholder="Autre champ" />
          </div>
        </Section>

        <Section title="Statistiques">
          <div className="grid gap-4 sm:grid-cols-3">
            <ProStat
              tone="brand"
              icon={<Dot />}
              label="Encaissé"
              value="1 250 000 FCFA"
              hint="Missions validées, net"
              delta={{ text: "+12 %", up: true }}
            />
            <ProStat icon={<Dot />} label="En cours" value="320 000 FCFA" hint="Commandes non validées" />
            <ProStat
              tone="gold"
              icon={<Dot />}
              label="Disponible"
              value="930 000 FCFA"
              hint="Non encore versé"
              delta={{ text: "−3 %", up: false }}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MiniStat label="En file" value="2 · 180 000 FCFA" />
            <MiniStat label="En cours" value="1 · 90 000 FCFA" />
            <MiniStat label="Payés" value="14 · 1 020 000 FCFA" />
            <MiniStat label="Échecs" value="0" />
          </div>
        </Section>

        <Section title="Bandeaux d'information" subtitle="Les quatre tons, sur les tokens.">
          <div className="space-y-3">
            <Notice tone="warning" title="Deux dossiers attendent une décision">
              Les vérifications en attente bloquent la publication des prestations.
            </Notice>
            <Notice tone="danger" title="Le numéro n'a pas pu être vérifié">
              Vérifiez le numéro puis relancez la demande.
            </Notice>
            <Notice tone="success">Canal de versement enregistré.</Notice>
            <Notice tone="info">Les versements automatiques ne sont pas encore activés.</Notice>
            <Notice
              tone="warning"
              title="Action attendue"
              action={
                <Link href="/charte" className="btn-ghost btn-sm">
                  Traiter
                </Link>
              }
            >
              Un bandeau peut porter une action à droite.
            </Notice>
          </div>
        </Section>

        <TableCard title="Tableau" subtitle="TableCard habille thead/tbody sans les réécrire.">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Statut</th>
                <th>Date</th>
                <th className="text-right">Montant</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {["TOO-4821", "TOO-4820", "TOO-4819"].map((ref, i) => (
                <tr key={ref}>
                  <td className="font-semibold text-[var(--color-brand-600)]">{ref}</td>
                  <td>
                    <Pill tone={orderTone(orders[i])}>{orders[i]}</Pill>
                  </td>
                  <td className="text-[var(--subtle)]">12 oct. 2026</td>
                  <td className="text-right font-display font-bold">45 000 FCFA</td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <button type="button" className="btn-ghost btn-sm">
                        Détail
                      </button>
                      <button type="button" className="btn-primary btn-sm">
                        Confirmer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </TableCard>

        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="Avatars et progression">
            <div className="flex items-center gap-3">
              <Avatar name="Awa Traoré" size="sm" />
              <Avatar name="Yao Kouassi" />
              <Avatar name="Fatou Diallo" size="lg" />
            </div>
            <div className="mt-6 space-y-4">
              <div>
                <p className="mb-2 text-xs font-medium text-[var(--subtle)]">Profil complété — 72 %</p>
                <ProgressBar value={72} />
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-[var(--subtle)]">Objectif du mois — 40 %</p>
                <ProgressBar value={40} tone="gold" />
              </div>
            </div>
          </Section>

          <Section title="Actions rapides">
            <div className="space-y-3">
              <QuickAction
                href="/charte"
                icon={<Dot />}
                title="Publier une prestation"
                desc="Forfaits, délais, images de couverture"
              />
              <QuickAction
                href="/charte"
                icon={<Dot />}
                title="Configurer les versements"
                desc="Mobile money, numéro vérifié"
              />
            </div>
          </Section>
        </div>

        <Section title="Cartes et typographie">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card card-pad">
              <p className="font-display text-base font-bold">Carte</p>
              <p className="mt-1 text-sm text-[var(--subtle)]">
                <code>.card</code> + <code>.card-pad</code>
              </p>
            </div>
            <div className="card card-pad">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--subtle)]">
                Kicker
              </p>
              <p className="mt-1 font-display text-lg font-bold">Titre de section</p>
              <p className="mt-1 text-sm text-[var(--subtle)]">Sous-titre explicatif</p>
            </div>
            <div className="card card-pad">
              <p className="flex items-center gap-2 text-xs font-medium">
                <span className="rail-pill">
                  <span className="rail-pill-dot bg-[var(--color-brand-500)]" /> Wave
                </span>
                <span className="rail-pill">
                  <span className="rail-pill-dot bg-[var(--color-gold-500)]" /> Orange Money
                </span>
              </p>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Dot() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <circle cx="10" cy="10" r="7" />
    </svg>
  );
}

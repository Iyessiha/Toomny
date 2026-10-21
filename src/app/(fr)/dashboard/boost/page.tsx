import type { Metadata } from "next";
import { requireAuth, isProvider } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell, EmptyState } from "@/components/dashboard/shell";
import { Notice, Pill, ProStat, Section, TableCard } from "@/components/dashboard/pro";
import { BoostCheckoutButton } from "@/components/dashboard/boost-checkout-button";
import { AutoRefresh } from "@/components/dashboard/auto-refresh";
import { dashboardNavSections } from "@/lib/dashboard-nav";
import { getDashboardTexts } from "@/i18n/dashboard";
import { formatMoney } from "@/lib/money";
import { BOOSTS, BOOST_TIERS } from "@/lib/boost";
import { NotificationBell } from "@/components/dashboard/notification-bell";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Boost · Toomny" };
}

type BoostRow = {
  id: string;
  tier: string;
  status: string;
  amount_minor: number | string;
  currency: string;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
};

const BOOST_NAMES: Record<string, string> = {
  starter: "Boost Starter",
  pro: "Boost Pro",
  elite: "Boost Elite",
};

const BOOST_STATUS_FR: Record<string, string> = {
  pending: "En attente",
  active: "Actif",
  expired: "Expiré",
  failed: "Échoué",
};

function boostTone(status: string) {
  if (status === "active") return "success" as const;
  if (status === "failed") return "danger" as const;
  if (status === "expired") return "neutral" as const;
  return "warning" as const;
}

export default async function BoostPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>;
}) {
  const user = await requireAuth();
  if (!isProvider(user.role)) redirect("/dashboard");
  const locale = user.preferredLocale;
  const t = getDashboardTexts(locale);
  const { payment } = await searchParams;

  const supabase = await createClient();
  const { data: boostRows } = await supabase
    .from("boosts")
    .select("id, tier, status, amount_minor, currency, period_start, period_end, created_at")
    .eq("provider_id", user.id)
    .order("created_at", { ascending: false })
    .limit(25);

  const history = (boostRows ?? []) as BoostRow[];
  const dateTag = locale === "en" ? "en-GB" : "fr-FR";
  const now = new Date();
  // Un boost « actif » dont la période est passée est expiré : on ne l'affiche pas comme en cours.
  const activeBoost = history.find((b) => b.status === "active" && b.period_end && new Date(b.period_end) > now);
  const periodEnd = activeBoost?.period_end ? new Date(activeBoost.period_end) : null;
  const daysLeft =
    periodEnd && periodEnd > now
      ? Math.ceil((periodEnd.getTime() - now.getTime()) / 86_400_000)
      : null;

  return (
    <DashboardShell
      user={user}
      bell={<NotificationBell locale={locale} />}
      locale={locale}
      kicker="Boost"
      title="Service Boost"
      subtitle="Mettez vos prestations en avant sur les points stratégiques du site."
      navSections={dashboardNavSections(t.nav, user.role, "/dashboard/boost")}
    >
      <AutoRefresh />

      {payment === "success" && (
        <div className="mb-6">
          <Notice tone="success" title="Paiement reçu">
            Votre boost sera activé dès la confirmation du paiement, généralement en quelques secondes.
          </Notice>
        </div>
      )}
      {payment === "error" && (
        <div className="mb-6">
          <Notice tone="danger" title="Paiement refusé">
            Le paiement n&apos;a pas abouti. Vérifiez votre solde et réessayez.
          </Notice>
        </div>
      )}

      {/* Statut actif */}
      {activeBoost && (
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <ProStat
            tone="gold"
            icon={
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            }
            label="Boost actif"
            value={BOOST_NAMES[activeBoost.tier] ?? activeBoost.tier}
            hint="Abonnement en cours"
          />
          <ProStat
            tone="brand"
            icon={
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            }
            label="Jours restants"
            value={daysLeft !== null ? `${daysLeft} j` : "—"}
            hint={
              periodEnd
                ? `Expire le ${periodEnd.toLocaleDateString(dateTag, { day: "2-digit", month: "short", year: "numeric" })}`
                : ""
            }
          />
          <ProStat
            icon={
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
              </svg>
            }
            label="Emplacements inclus"
            value={String(BOOSTS[activeBoost.tier as keyof typeof BOOSTS]?.placements.length ?? "—")}
            hint="Points de visibilité"
          />
        </div>
      )}

      {/* Grille des offres */}
      <h2 className="mb-4 font-display text-lg font-bold">
        {activeBoost ? "Renouveler ou changer d'offre" : "Choisir une offre Boost"}
      </h2>
      <div className="grid gap-5 sm:grid-cols-3">
        {BOOST_TIERS.map((tier) => {
          const spec = BOOSTS[tier];
          const isCurrent = activeBoost?.tier === tier;
          const highlight = tier === "pro";

          const placements: Record<string, string> = {
            catalogue_badge: "Badge « Boosté » dans le catalogue",
            catalogue_sort: "Priorité dans le tri des services",
            search_sponsored: "Résultats sponsorisés dans la recherche",
            homepage_featured: "Section vedette sur la page d'accueil",
          };

          return (
            <div
              key={tier}
              className={`relative flex flex-col rounded-2xl border p-6 ${
                highlight
                  ? "border-[var(--color-brand-500)] bg-[var(--color-brand-500)]"
                  : "border-[var(--border)] bg-[var(--background)]"
              }`}
            >
              {(isCurrent || highlight) && (
                <span
                  className={`absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3.5 py-1 text-xs font-semibold ${
                    highlight
                      ? "bg-white text-[var(--color-brand-600)]"
                      : "bg-[var(--color-brand-500)] text-white"
                  }`}
                >
                  {isCurrent ? "Actif" : "Populaire"}
                </span>
              )}

              <p className={`font-display text-lg font-bold ${highlight ? "text-white" : ""}`}>
                {BOOST_NAMES[tier]}
              </p>

              <div className="mt-4">
                <span
                  className={`font-display text-2xl font-bold ${highlight ? "text-white" : ""}`}
                >
                  {formatMoney(spec.priceMinor, spec.currency, locale)}
                </span>
                <span className={`ml-1.5 text-sm ${highlight ? "text-white/70" : "text-[var(--subtle)]"}`}>
                  / mois
                </span>
              </div>

              <ul className="mt-5 flex-1 space-y-2.5">
                {spec.placements.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm">
                    <span className={`mt-0.5 shrink-0 ${highlight ? "text-white/80" : "text-[var(--color-brand-500)]"}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <span className={highlight ? "text-white/90" : ""}>{placements[p] ?? p}</span>
                  </li>
                ))}
              </ul>

              <BoostCheckoutButton
                tier={tier}
                highlight={highlight}
                label={isCurrent ? "Renouveler" : "Activer"}
                redirectingLabel="Redirection…"
                errorLabel="Erreur de paiement. Réessayez."
              />
            </div>
          );
        })}
      </div>

      {/* Historique */}
      <div className="mt-10">
        {history.length === 0 ? (
          <Section title="Historique">
            <EmptyState title="Aucun boost" body="Activez votre premier boost pour apparaître en position prioritaire." />
          </Section>
        ) : (
          <TableCard title="Historique des boosts">
            <thead>
              <tr>
                <th>Date</th>
                <th>Offre</th>
                <th>Période</th>
                <th>Statut</th>
                <th className="text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              {history.map((b) => {
                const period =
                  b.period_start && b.period_end
                    ? `${new Date(b.period_start).toLocaleDateString(dateTag, { day: "2-digit", month: "short" })} → ${new Date(b.period_end).toLocaleDateString(dateTag, { day: "2-digit", month: "short", year: "numeric" })}`
                    : "—";
                return (
                  <tr key={b.id}>
                    <td className="text-[var(--subtle)]">
                      {new Date(b.created_at).toLocaleDateString(dateTag, { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="font-semibold">{BOOST_NAMES[b.tier] ?? b.tier}</td>
                    <td className="text-[var(--subtle)]">{period}</td>
                    <td>
                      <Pill tone={boostTone(b.status)}>{BOOST_STATUS_FR[b.status] ?? b.status}</Pill>
                    </td>
                    <td className="text-right font-display font-bold">
                      {formatMoney(BigInt(b.amount_minor), b.currency, locale)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableCard>
        )}
      </div>
    </DashboardShell>
  );
}

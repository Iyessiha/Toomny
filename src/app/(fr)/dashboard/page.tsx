import Link from "next/link";
import type { Metadata } from "next";
import { requireAuth, isProvider } from "@/lib/auth";
import { getDashboardData, ORDER_STATUS_FR, statusTone } from "@/lib/dashboard";
import { DashboardShell, StatCard, EmptyState } from "@/components/dashboard/shell";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = { title: "Tableau de bord" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireAuth();
  const data = await getDashboardData(user);
  const provider = isProvider(user.role);
  const cur = data.currency;

  return (
    <DashboardShell
      user={user}
      title={`Bonjour ${user.displayName?.split(" ")[0] ?? ""}`.trim()}
      subtitle={provider ? "Votre activité de prestataire" : "Vos commandes en cours"}
      nav={[
        { href: "/dashboard", label: "Vue d'ensemble", current: true },
        { href: "/orders", label: "Commandes" },
        { href: "/messages", label: "Messages" },
        ...(user.role === "admin" ? [{ href: "/admin", label: "Administration" }] : []),
      ]}
    >
      {/* Vérification d'identité : bloquante pour encaisser, donc mise en avant. */}
      {user.verificationStatus !== "verified" && (
        <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-sm font-bold text-amber-900">
              Votre identité n&apos;est pas encore vérifiée
            </p>
            <p className="mt-1 text-sm text-amber-800">
              {provider
                ? "La vérification est nécessaire pour recevoir vos versements."
                : "La vérification rassure les prestataires et accélère vos commandes."}
            </p>
          </div>
          <Link
            href="/dashboard/verification"
            className="shrink-0 rounded-full bg-amber-900 px-5 py-2.5 text-center text-sm font-semibold text-white"
          >
            Vérifier mon identité
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {provider ? (
          <>
            <StatCard
              label="Encaissé"
              value={formatMoney(data.earnedMinor, cur, "fr")}
              hint="Missions validées"
              accent
            />
            <StatCard
              label="En attente"
              value={formatMoney(data.pendingMinor, cur, "fr")}
              hint="Fonds bloqués, pas encore libérés"
            />
            <StatCard label="Prestations publiées" value={String(data.servicesCount)} />
            <StatCard label="Commandes" value={String(data.orders.length)} />
          </>
        ) : (
          <>
            <StatCard
              label="Dépensé"
              value={formatMoney(data.spentMinor, cur, "fr")}
              hint="Hors annulations"
              accent
            />
            <StatCard label="Commandes" value={String(data.orders.length)} />
            <StatCard
              label="En cours"
              value={String(data.orders.filter((o) => !["completed", "cancelled", "refunded"].includes(o.status)).length)}
            />
            <StatCard label="Terminées" value={String(data.orders.filter((o) => o.status === "completed").length)} />
          </>
        )}
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Commandes récentes</h2>
          {data.orders.length > 0 && (
            <Link href="/orders" className="text-sm text-[var(--color-brand-600)] underline underline-offset-4">
              Tout voir
            </Link>
          )}
        </div>

        {data.orders.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              title={provider ? "Aucune commande pour l'instant" : "Vous n'avez pas encore commandé"}
              body={
                provider
                  ? "Publiez une prestation pour apparaître dans le catalogue. Les clients vous trouveront par catégorie."
                  : "Parcourez le catalogue : chaque prestation affiche son prix et son délai, et vos fonds restent bloqués jusqu'à la livraison."
              }
              action={
                provider
                  ? { href: "/dashboard/prestations", label: "Publier une prestation" }
                  : { href: "/services", label: "Parcourir le catalogue" }
              }
            />
          </div>
        ) : (
          <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--subtle)]">
                <tr>
                  <th className="px-5 py-3 font-medium">Référence</th>
                  <th className="px-5 py-3 font-medium">Statut</th>
                  <th className="px-5 py-3 text-right font-medium">
                    {provider ? "Net pour vous" : "Montant"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.orders.slice(0, 8).map((o, i) => (
                  <tr key={o.id} className={i < 7 ? "border-b border-[var(--border)]" : ""}>
                    <td className="px-5 py-4 font-medium">{o.reference}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(o.status)}`}>
                        {ORDER_STATUS_FR[o.status] ?? o.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-display font-bold">
                      {formatMoney(
                        BigInt(provider ? o.provider_net_minor : o.amount_minor),
                        o.currency,
                        "fr",
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {provider && (
        <section className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6">
          <h2 className="font-display text-base font-bold">Recevoir vos versements</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--subtle)]">
            Renseignez le numéro mobile money sur lequel vous souhaitez être payé. Wave est
            recommandé : la réception y est gratuite.
          </p>
          <Link
            href="/dashboard/versements"
            className="mt-5 inline-flex rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-[var(--surface)]"
          >
            Configurer mes versements
          </Link>
        </section>
      )}
    </DashboardShell>
  );
}

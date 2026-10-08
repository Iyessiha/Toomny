import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getAdminStats } from "@/lib/admin-stats";
import { DashboardShell, StatCard, EmptyState } from "@/components/dashboard/shell";
import { ORDER_STATUS_FR, statusTone } from "@/lib/dashboard";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = { title: "Administration" };
export const dynamic = "force-dynamic";

const ROLE_FR: Record<string, string> = {
  client: "Client",
  provider: "Prestataire",
  both: "Les deux",
  admin: "Admin",
};

export default async function AdminPage() {
  const user = await requireAdmin();
  const s = await getAdminStats();

  const needsAttention = s.openDisputes + s.pendingVerifications;

  return (
    <DashboardShell
      user={user}
      title="Administration"
      subtitle="Vue d'ensemble de la plateforme"
      nav={[
        { href: "/admin", label: "Vue d'ensemble", current: true },
        { href: "/admin/verifications", label: "Vérifications KYC" },
        { href: "/admin/services", label: "Prestations" },
        { href: "/dashboard", label: "Mon tableau de bord" },
      ]}
    >
      {/* Ce qui demande une action humaine passe en premier. */}
      {needsAttention > 0 && (
        <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-sm font-bold text-amber-900">
              {needsAttention} dossier{needsAttention > 1 ? "s" : ""} en attente
            </p>
            <p className="mt-1 text-sm text-amber-800">
              {s.openDisputes} litige{s.openDisputes > 1 ? "s" : ""} ouvert
              {s.openDisputes > 1 ? "s" : ""} · {s.pendingVerifications} vérification
              {s.pendingVerifications > 1 ? "s" : ""} d&apos;identité à traiter.
            </p>
          </div>
          {s.pendingVerifications > 0 && (
            <a
              href="/admin/verifications"
              className="shrink-0 rounded-full bg-amber-900 px-5 py-2 text-center text-sm font-semibold text-white hover:bg-amber-800"
            >
              Traiter les KYC
            </a>
          )}
        </div>
      )}

      <section>
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-[var(--subtle)]">
          Volume d&apos;affaires
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Volume traité"
            value={formatMoney(s.gmvMinor, s.currency, "fr")}
            hint="Hors annulations et remboursements"
            accent
          />
          <StatCard
            label="Commission brute"
            value={formatMoney(s.commissionMinor, s.currency, "fr")}
            hint="Avant frais d'agrégateur"
          />
          <StatCard label="Commandes" value={String(s.orders)} hint={`${s.completedOrders} terminées`} />
          <StatCard
            label="Taux de complétion"
            value={s.orders > 0 ? `${Math.round((s.completedOrders / s.orders) * 100)} %` : "—"}
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-[var(--subtle)]">
          Offre et demande
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Comptes" value={String(s.users)} hint={`${s.providers} prestataires`} />
          <StatCard label="Prestations" value={String(s.services)} hint={`${s.activeServices} publiées`} />
          <StatCard label="Litiges ouverts" value={String(s.openDisputes)} />
          <StatCard label="Vérifications en attente" value={String(s.pendingVerifications)} />
        </div>
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="font-display text-base font-bold">Derniers inscrits</h2>
          {s.recentUsers.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="Aucun compte" body="Les inscriptions apparaîtront ici." />
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--subtle)]">
                  <tr>
                    <th className="px-5 py-3 font-medium">Nom</th>
                    <th className="px-5 py-3 font-medium">Rôle</th>
                    <th className="px-5 py-3 font-medium">Pays</th>
                  </tr>
                </thead>
                <tbody>
                  {s.recentUsers.map((u, i) => (
                    <tr key={u.id} className={i < s.recentUsers.length - 1 ? "border-b border-[var(--border)]" : ""}>
                      <td className="px-5 py-3.5">
                        <p className="font-medium">{u.display_name ?? "—"}</p>
                        <p className="text-xs text-[var(--subtle)]">{u.email}</p>
                      </td>
                      <td className="px-5 py-3.5 text-[var(--subtle)]">{ROLE_FR[u.role] ?? u.role}</td>
                      <td className="px-5 py-3.5 text-[var(--subtle)]">{u.country_code}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <h2 className="font-display text-base font-bold">Dernières commandes</h2>
          {s.recentOrders.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="Aucune commande" body="Les commandes apparaîtront ici dès la première transaction." />
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--subtle)]">
                  <tr>
                    <th className="px-5 py-3 font-medium">Référence</th>
                    <th className="px-5 py-3 font-medium">Statut</th>
                    <th className="px-5 py-3 text-right font-medium">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {s.recentOrders.map((o, i) => (
                    <tr key={o.id} className={i < s.recentOrders.length - 1 ? "border-b border-[var(--border)]" : ""}>
                      <td className="px-5 py-3.5 font-medium">{o.reference}</td>
                      <td className="px-5 py-3.5">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(o.status)}`}>
                          {ORDER_STATUS_FR[o.status] ?? o.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-display font-bold">
                        {formatMoney(BigInt(o.amount_minor), o.currency, "fr")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

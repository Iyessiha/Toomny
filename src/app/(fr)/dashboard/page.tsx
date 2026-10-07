import Link from "next/link";
import type { Metadata } from "next";
import { requireAuth, isProvider } from "@/lib/auth";
import { getDashboardData, ORDER_STATUS_FR, statusTone } from "@/lib/dashboard";
import { DashboardShell, StatCard, EmptyState } from "@/components/dashboard/shell";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = { title: "Tableau de bord · Toomny" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireAuth();
  const data = await getDashboardData(user);
  const provider = isProvider(user.role);

  return provider
    ? <ProviderDashboard user={user} data={data} />
    : <ClientDashboard user={user} data={data} />;
}

// ---------------------------------------------------------------------------
// Dashboard PRESTATAIRE — complet
// ---------------------------------------------------------------------------
function ProviderDashboard({
  user,
  data,
}: {
  user: Awaited<ReturnType<typeof requireAuth>>;
  data: Awaited<ReturnType<typeof getDashboardData>>;
}) {
  const cur = data.currency;
  const kycDone = user.verificationStatus === "verified";
  const kycPending = user.verificationStatus === "pending" || user.verificationStatus === "manual_review";
  const kycRejected = user.verificationStatus === "rejected";

  return (
    <DashboardShell
      user={user}
      title={`Bonjour ${user.firstName ?? user.displayName?.split(" ")[0] ?? ""} 👋`}
      subtitle="Votre espace prestataire"
      nav={[
        { href: "/dashboard", label: "Vue d'ensemble", current: true },
        { href: "/dashboard/prestations", label: "Mes prestations" },
        { href: "/dashboard/versements", label: "Versements" },
        { href: "/orders", label: "Commandes" },
        { href: "/messages", label: "Messages" },
        { href: "/dashboard/verification", label: "Vérification KYC" },
        ...(user.role === "admin" ? [{ href: "/admin", label: "Admin" }] : []),
      ]}
    >
      {/* Bannière KYC — bloquante pour encaisser */}
      {!kycDone && !kycPending && (
        <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-sm font-bold text-amber-900">
              {kycRejected ? "Vérification rejetée — nouvelle soumission possible" : "Vérifiez votre identité pour être payé"}
            </p>
            <p className="mt-1 text-sm text-amber-800">
              {kycRejected
                ? "Votre précédente demande a été rejetée. Soumettez un nouveau document."
                : "La vérification est obligatoire avant de recevoir vos versements mobile money."}
            </p>
          </div>
          <Link
            href="/dashboard/verification"
            className="shrink-0 rounded-full bg-amber-900 px-5 py-2.5 text-center text-sm font-semibold text-white hover:bg-amber-800"
          >
            {kycRejected ? "Resoumettre" : "Vérifier maintenant"}
          </Link>
        </div>
      )}

      {kycPending && (
        <div className="mb-8 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-800">
          <strong>Vérification en cours</strong> — notre équipe examine vos documents (24-48 h).
        </div>
      )}

      {/* Stats principales */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Encaissé"
          value={formatMoney(data.earnedMinor, cur, "fr")}
          hint="Missions validées"
          accent
        />
        <StatCard
          label="En attente"
          value={formatMoney(data.pendingMinor, cur, "fr")}
          hint="Fonds bloqués"
        />
        <StatCard
          label="Prestations"
          value={String(data.servicesCount)}
          hint="Publiées"
        />
        <StatCard
          label="Commandes"
          value={String(data.orders.length)}
          hint="Toutes périodes"
        />
      </div>

      {/* Profil + actions rapides */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {/* Compléter le profil */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--subtle)]">Profil</p>
          <p className="mt-2 text-sm font-medium">{user.displayName ?? "—"}</p>
          <p className="text-xs text-[var(--subtle)]">{user.city ? `${user.city} · ` : ""}{user.countryCode}</p>
          {user.phone && <p className="mt-1 text-xs text-[var(--subtle)]">{user.phone}</p>}
          <div className="mt-3 flex items-center gap-2">
            <div className={`h-1.5 w-1.5 rounded-full ${kycDone ? "bg-[var(--color-brand-500)]" : "bg-amber-400"}`} />
            <span className="text-xs text-[var(--subtle)]">
              {kycDone ? "Identité vérifiée" : "Vérification requise"}
            </span>
          </div>
        </div>

        {/* Publier une prestation */}
        <Link
          href="/dashboard/prestations"
          className="group flex flex-col justify-between rounded-2xl border border-dashed border-[var(--color-brand-300)] bg-[var(--color-brand-50)] p-5 transition-colors hover:bg-[var(--color-brand-100)]"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-brand-500)] text-white">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <div className="mt-4">
            <p className="text-sm font-semibold text-[var(--color-brand-800)]">Publier une prestation</p>
            <p className="mt-0.5 text-xs text-[var(--color-brand-600)]">Soyez visible dans le catalogue</p>
          </div>
        </Link>

        {/* Configurer versements */}
        <Link
          href="/dashboard/versements"
          className="flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 transition-colors hover:bg-[var(--surface)]"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface)]">
            <svg className="h-4 w-4 text-[var(--subtle)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
            </svg>
          </div>
          <div className="mt-4">
            <p className="text-sm font-semibold">Configurer les versements</p>
            <p className="mt-0.5 text-xs text-[var(--subtle)]">Wave · Orange Money · MTN MoMo</p>
          </div>
        </Link>
      </div>

      {/* Commandes récentes */}
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Commandes reçues</h2>
          {data.orders.length > 0 && (
            <Link href="/orders" className="text-sm text-[var(--color-brand-600)] underline underline-offset-4">
              Tout voir
            </Link>
          )}
        </div>

        {data.orders.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              title="Aucune commande pour l'instant"
              body="Publiez une prestation pour apparaître dans le catalogue. Les clients vous trouveront par catégorie et pourront commander directement."
              action={{ href: "/dashboard/prestations", label: "Publier une prestation" }}
            />
          </div>
        ) : (
          <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--subtle)]">
                <tr>
                  <th className="px-5 py-3 font-medium">Référence</th>
                  <th className="px-5 py-3 font-medium">Statut</th>
                  <th className="px-5 py-3 text-right font-medium">Net pour vous</th>
                </tr>
              </thead>
              <tbody>
                {data.orders.slice(0, 8).map((o, i) => (
                  <tr key={o.id} className={i < Math.min(data.orders.length, 8) - 1 ? "border-b border-[var(--border)]" : ""}>
                    <td className="px-5 py-4 font-medium">{o.reference}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(o.status)}`}>
                        {ORDER_STATUS_FR[o.status] ?? o.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-display font-bold">
                      {formatMoney(BigInt(o.provider_net_minor), o.currency, "fr")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </DashboardShell>
  );
}

// ---------------------------------------------------------------------------
// Dashboard CLIENT — simple et orienté action
// ---------------------------------------------------------------------------
function ClientDashboard({
  user,
  data,
}: {
  user: Awaited<ReturnType<typeof requireAuth>>;
  data: Awaited<ReturnType<typeof getDashboardData>>;
}) {
  const cur = data.currency;
  const inProgress = data.orders.filter(
    (o) => !["completed", "cancelled", "refunded"].includes(o.status),
  ).length;
  const completed = data.orders.filter((o) => o.status === "completed").length;

  return (
    <DashboardShell
      user={user}
      title={`Bonjour ${user.firstName ?? user.displayName?.split(" ")[0] ?? ""} 👋`}
      subtitle="Bienvenue sur Toomny"
      nav={[
        { href: "/dashboard", label: "Accueil", current: true },
        { href: "/services", label: "Trouver un prestataire" },
        { href: "/orders", label: "Mes commandes" },
        { href: "/messages", label: "Messages" },
        ...(user.role === "admin" ? [{ href: "/admin", label: "Admin" }] : []),
      ]}
    >
      {/* CTA principal — trouver un prestataire */}
      <div className="mb-8 flex flex-col gap-4 rounded-2xl bg-[var(--color-brand-500)] p-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold">Trouvez le bon prestataire</h2>
          <p className="mt-1 text-sm text-white/80">
            Des centaines de talents vérifiés en Afrique de l&apos;Ouest. Paiement sécurisé, livraison garantie.
          </p>
        </div>
        <Link
          href="/services"
          className="shrink-0 rounded-full bg-white px-6 py-3 text-sm font-bold text-[var(--color-brand-700)] hover:bg-white/90"
        >
          Explorer le catalogue →
        </Link>
      </div>

      {/* Stats légères */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Dépensé"
          value={formatMoney(data.spentMinor, cur, "fr")}
          hint="Hors annulations"
          accent
        />
        <StatCard label="En cours" value={String(inProgress)} hint="Commandes actives" />
        <StatCard label="Terminées" value={String(completed)} hint="Missions validées" />
      </div>

      {/* Commandes récentes */}
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Mes commandes</h2>
          {data.orders.length > 0 && (
            <Link href="/orders" className="text-sm text-[var(--color-brand-600)] underline underline-offset-4">
              Tout voir
            </Link>
          )}
        </div>

        {data.orders.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              title="Vous n'avez pas encore commandé"
              body="Parcourez le catalogue et trouvez le prestataire idéal. Vos fonds restent bloqués jusqu'à la livraison — vous ne payez que si vous êtes satisfait."
              action={{ href: "/services", label: "Parcourir le catalogue" }}
            />
          </div>
        ) : (
          <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--subtle)]">
                <tr>
                  <th className="px-5 py-3 font-medium">Référence</th>
                  <th className="px-5 py-3 font-medium">Statut</th>
                  <th className="px-5 py-3 text-right font-medium">Montant</th>
                </tr>
              </thead>
              <tbody>
                {data.orders.slice(0, 8).map((o, i) => (
                  <tr key={o.id} className={i < Math.min(data.orders.length, 8) - 1 ? "border-b border-[var(--border)]" : ""}>
                    <td className="px-5 py-4 font-medium">{o.reference}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(o.status)}`}>
                        {ORDER_STATUS_FR[o.status] ?? o.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-display font-bold">
                      {formatMoney(BigInt(o.amount_minor), o.currency, "fr")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Proposer ses services (si le client veut aussi travailler) */}
      <section className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <p className="text-sm font-semibold">Vous avez aussi des compétences à proposer ?</p>
        <p className="mt-1 text-sm text-[var(--subtle)]">
          Créez un compte prestataire pour proposer vos services et être payé par mobile money.
        </p>
        <Link
          href="/auth?role=provider"
          className="mt-4 inline-flex rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-[var(--background)]"
        >
          Devenir prestataire
        </Link>
      </section>
    </DashboardShell>
  );
}

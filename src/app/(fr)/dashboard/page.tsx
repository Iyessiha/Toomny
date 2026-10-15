import Link from "next/link";
import type { Metadata } from "next";
import { requireAuth, isProvider } from "@/lib/auth";
import { getDashboardData, ORDER_STATUS_FR, statusTone } from "@/lib/dashboard";
import { DashboardShell, StatCard, EmptyState } from "@/components/dashboard/shell";
import { dashboardNavSections } from "@/lib/dashboard-nav";
import { getDashboardTexts } from "@/i18n/dashboard";
import { formatMoney } from "@/lib/money";
import { OnboardingModal } from "@/components/dashboard/onboarding-modal";

export const metadata: Metadata = { title: "Tableau de bord · Toomny" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireAuth();
  const data = await getDashboardData(user);
  const provider = isProvider(user.role);

  return (
    <>
      {!user.onboardingDone && (
        <OnboardingModal role={user.role} locale={user.preferredLocale} />
      )}
      {provider
        ? <ProviderDashboard user={user} data={data} />
        : <ClientDashboard user={user} data={data} />}
    </>
  );
}

// ─── Dashboard PRESTATAIRE ──────────────────────────────────────────────────

function ProviderDashboard({
  user,
  data,
}: {
  user: Awaited<ReturnType<typeof requireAuth>>;
  data: Awaited<ReturnType<typeof getDashboardData>>;
}) {
  const locale = user.preferredLocale;
  const t = getDashboardTexts(locale);
  const cur = data.currency;
  const kycDone = user.verificationStatus === "verified";
  const kycPending = user.verificationStatus === "pending" || user.verificationStatus === "manual_review";
  const kycRejected = user.verificationStatus === "rejected";
  const firstName = user.firstName ?? user.displayName?.split(" ")[0] ?? "vous";

  const completedOrders = data.orders.filter((o) => o.status === "completed").length;
  const activeOrders = data.orders.filter((o) =>
    ["funded", "in_progress", "delivered"].includes(o.status)
  ).length;

  return (
    <DashboardShell
      user={user}
      title={`Bonjour, ${firstName}`}
      subtitle={new Date().toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      locale={locale}
      navSections={dashboardNavSections(t.nav, user.role, "/dashboard")}
      actions={
        <Link
          href="/dashboard/prestations"
          className="flex items-center gap-2 rounded-full bg-[var(--color-brand-500)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.02] active:scale-95"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Publier
        </Link>
      }
    >
      {/* ── KYC Banner ─────────────────────────────────────────────────── */}
      {!kycDone && !kycPending && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-amber-200 bg-amber-50">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-amber-900">
                  {kycRejected ? "Vérification rejetée — nouvelle soumission possible" : "Vérifiez votre identité pour encaisser"}
                </p>
                <p className="mt-0.5 text-sm text-amber-800">
                  {kycRejected
                    ? "Votre demande précédente a été rejetée. Consultez le motif et soumettez un nouveau document."
                    : "La vérification KYC est obligatoire avant de recevoir des versements mobile money (Wave, Orange Money…)."}
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/verification"
              className="shrink-0 rounded-full bg-amber-800 px-5 py-2.5 text-center text-sm font-semibold text-white hover:bg-amber-900"
            >
              {kycRejected ? "Resoumettre" : "Vérifier mon identité"}
            </Link>
          </div>
          <div className="h-1 bg-amber-200">
            <div className="h-full w-0 bg-amber-400" />
          </div>
        </div>
      )}

      {kycPending && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100">
            <svg className="animate-spin text-blue-600" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" opacity=".25" /><path d="M21 12a9 9 0 0 0-9-9" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-900">Vérification en cours d&apos;examen</p>
            <p className="mt-0.5 text-xs text-blue-700">Notre équipe examine vos documents. Résultat sous 24-48 h ouvrées.</p>
          </div>
        </div>
      )}

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total encaissé"
          value={formatMoney(data.earnedMinor, cur, "fr")}
          hint={`${completedOrders} mission${completedOrders !== 1 ? "s" : ""} validée${completedOrders !== 1 ? "s" : ""}`}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
          accent
        />
        <StatCard
          label="En attente"
          value={formatMoney(data.pendingMinor, cur, "fr")}
          hint="Fonds sécurisés en séquestre"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>}
        />
        <StatCard
          label="Prestations"
          value={String(data.servicesCount)}
          hint="Publications actives"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>}
        />
        <StatCard
          label="Commandes actives"
          value={String(activeOrders)}
          hint="En cours de livraison"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="m9 12 2 2 4-4"/></svg>}
        />
      </div>

      {/* ── Corps principal ─────────────────────────────────────────────── */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_300px]">

        {/* Commandes récentes */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-bold">Commandes reçues</h2>
            {data.orders.length > 0 && (
              <Link href="/orders" className="text-sm font-medium text-[var(--color-brand-600)] hover:underline">
                Voir tout →
              </Link>
            )}
          </div>

          {data.orders.length === 0 ? (
            <EmptyState
              title="Aucune commande pour l'instant"
              body="Publiez votre première prestation pour apparaître dans le catalogue et recevoir des commandes."
              action={{ href: "/dashboard/prestations", label: "Publier une prestation" }}
              icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>}
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--subtle)]">Référence</th>
                    <th className="hidden px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--subtle)] sm:table-cell">Date</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--subtle)]">Statut</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--subtle)]">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {data.orders.slice(0, 10).map((o) => (
                    <tr key={o.id} className="transition-colors hover:bg-[var(--surface)]">
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-medium text-[var(--subtle)]">{o.reference}</span>
                      </td>
                      <td className="hidden px-5 py-4 text-xs text-[var(--subtle)] sm:table-cell">
                        {new Date(o.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(o.status)}`}>
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

        {/* Sidebar droite */}
        <aside className="flex flex-col gap-4">
          {/* Profil */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--subtle)]">Mon profil</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-brand-100)] font-display text-sm font-bold text-[var(--color-brand-700)]">
                {(user.displayName ?? user.email ?? "?")[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold">{user.displayName ?? "—"}</p>
                <p className="text-xs text-[var(--subtle)]">{user.city ? `${user.city}, ` : ""}{user.countryCode ?? ""}</p>
              </div>
            </div>
            {user.phone && (
              <p className="mt-2.5 text-xs text-[var(--subtle)]">{user.phone}</p>
            )}
            <div className="mt-4 space-y-2">
              <ProfileRow label="Nom" done={!!user.displayName} />
              <ProfileRow label="Téléphone" done={!!user.phone} />
              <ProfileRow label="Ville" done={!!user.city} />
              <ProfileRow label="Identité vérifiée" done={kycDone} />
            </div>
          </div>

          {/* Actions rapides */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--subtle)]">Actions rapides</p>
            <div className="mt-3 space-y-2">
              <QuickLink href="/dashboard/prestations" label="Publier une prestation" icon="+" />
              <QuickLink href="/dashboard/versements" label="Configurer les versements" icon="→" />
              {!kycDone && <QuickLink href="/dashboard/verification" label="Vérifier mon identité" icon="🛡" warn />}
              <QuickLink href="/services" label="Explorer le catalogue" icon="↗" />
            </div>
          </div>

          {/* Versements info */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--subtle)]">Modes de paiement</p>
            <div className="mt-3 space-y-2 text-sm">
              {["Wave", "Orange Money", "MTN MoMo", "Moov Money"].map((m) => (
                <div key={m} className="flex items-center gap-2 text-[var(--subtle)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand-400)]" />
                  {m}
                </div>
              ))}
            </div>
            <Link href="/dashboard/versements" className="mt-4 block text-xs font-medium text-[var(--color-brand-600)] hover:underline">
              Configurer mon numéro →
            </Link>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}

// ─── Dashboard CLIENT ───────────────────────────────────────────────────────

function ClientDashboard({
  user,
  data,
}: {
  user: Awaited<ReturnType<typeof requireAuth>>;
  data: Awaited<ReturnType<typeof getDashboardData>>;
}) {
  const locale = user.preferredLocale;
  const t = getDashboardTexts(locale);
  const cur = data.currency;
  const firstName = user.firstName ?? user.displayName?.split(" ")[0] ?? "vous";
  const activeOrders = data.orders.filter((o) =>
    ["funded", "in_progress", "delivered"].includes(o.status)
  );
  const completedOrders = data.orders.filter((o) => o.status === "completed");
  const disputedOrders = data.orders.filter((o) => o.status === "disputed");

  return (
    <DashboardShell
      user={user}
      title={`Bonjour, ${firstName}`}
      subtitle={new Date().toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      locale={locale}
      navSections={dashboardNavSections(t.nav, user.role, "/dashboard")}
      actions={
        <Link
          href="/services"
          className="flex items-center gap-2 rounded-full bg-[var(--color-brand-500)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.02] active:scale-95"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          Explorer
        </Link>
      }
    >
      {/* ── Litiges en cours ────────────────────────────────────────────── */}
      {disputedOrders.length > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0ZM12 9v4M12 17h.01"/></svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-red-800">{disputedOrders.length} litige{disputedOrders.length > 1 ? "s" : ""} en cours</p>
            <p className="mt-0.5 text-xs text-red-700">Notre équipe traite votre dossier. Vous serez notifié par e-mail.</p>
          </div>
        </div>
      )}

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total dépensé"
          value={formatMoney(data.spentMinor, cur, "fr")}
          hint="Hors annulations et remboursements"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
          accent
        />
        <StatCard
          label="En cours"
          value={String(activeOrders.length)}
          hint="Commandes actives"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>}
        />
        <StatCard
          label="Terminées"
          value={String(completedOrders.length)}
          hint="Missions validées"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>}
        />
      </div>

      {/* ── Corps principal ─────────────────────────────────────────────── */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_280px]">

        {/* Commandes */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-bold">Mes commandes</h2>
            {data.orders.length > 0 && (
              <Link href="/orders" className="text-sm font-medium text-[var(--color-brand-600)] hover:underline">
                Voir tout →
              </Link>
            )}
          </div>

          {/* Commandes actives — carte mise en avant */}
          {activeOrders.length > 0 && (
            <div className="mb-4 space-y-3">
              {activeOrders.slice(0, 3).map((o) => (
                <div key={o.id} className="flex items-center justify-between rounded-2xl border border-[var(--color-brand-200)] bg-[var(--color-brand-50)] px-5 py-4">
                  <div>
                    <p className="font-mono text-xs text-[var(--subtle)]">{o.reference}</p>
                    <span className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusTone(o.status)}`}>
                      {ORDER_STATUS_FR[o.status] ?? o.status}
                    </span>
                  </div>
                  <p className="font-display font-bold text-[var(--color-brand-700)]">
                    {formatMoney(BigInt(o.amount_minor), o.currency, "fr")}
                  </p>
                </div>
              ))}
            </div>
          )}

          {data.orders.length === 0 ? (
            <EmptyState
              title="Vous n'avez pas encore commandé"
              body="Trouvez le prestataire idéal parmi nos talents vérifiés. Vos fonds restent sécurisés jusqu'à la livraison."
              action={{ href: "/services", label: "Parcourir le catalogue" }}
              icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>}
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--subtle)]">Référence</th>
                    <th className="hidden px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--subtle)] sm:table-cell">Date</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--subtle)]">Statut</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--subtle)]">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {data.orders.slice(0, 10).map((o) => (
                    <tr key={o.id} className="transition-colors hover:bg-[var(--surface)]">
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-medium text-[var(--subtle)]">{o.reference}</span>
                      </td>
                      <td className="hidden px-5 py-4 text-xs text-[var(--subtle)] sm:table-cell">
                        {new Date(o.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(o.status)}`}>
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

        {/* Sidebar droite */}
        <aside className="flex flex-col gap-4">
          {/* CTA principal */}
          <div className="rounded-2xl bg-[var(--color-brand-500)] p-5 text-white">
            <p className="font-display text-base font-bold">Trouvez un talent</p>
            <p className="mt-1 text-sm text-white/80">Des prestataires vérifiés disponibles maintenant.</p>
            <Link
              href="/services"
              className="mt-4 block rounded-full bg-white px-4 py-2.5 text-center text-sm font-bold text-[var(--color-brand-700)] hover:bg-white/90"
            >
              Explorer le catalogue
            </Link>
          </div>

          {/* Garanties */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--subtle)]">Vos garanties</p>
            <ul className="mt-3 space-y-2.5">
              {[
                ["Fonds sécurisés", "Libérés à la livraison uniquement"],
                ["Prestataires vérifiés", "Identité contrôlée par Toomny"],
                ["Support 48 h", "Litige ? Nous intervenons"],
              ].map(([t, d]) => (
                <li key={t} className="flex items-start gap-2.5">
                  <svg className="mt-0.5 shrink-0 text-[var(--color-brand-500)]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  <div>
                    <p className="text-xs font-semibold">{t}</p>
                    <p className="text-xs text-[var(--subtle)]">{d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Devenir prestataire */}
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background)] p-5">
            <p className="text-sm font-semibold">Vous avez des compétences ?</p>
            <p className="mt-1 text-xs text-[var(--subtle)]">Proposez vos services et soyez payé par mobile money sous 24 h.</p>
            <Link
              href="/auth?role=provider"
              className="mt-4 block rounded-full border border-[var(--border)] px-4 py-2 text-center text-xs font-semibold transition-colors hover:bg-[var(--surface)]"
            >
              Devenir prestataire →
            </Link>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function ProfileRow({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-[var(--subtle)]">{label}</span>
      {done ? (
        <span className="flex items-center gap-1 font-medium text-[var(--color-brand-600)]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 13 4 4L19 7"/></svg>
          Complété
        </span>
      ) : (
        <span className="font-medium text-amber-500">À renseigner</span>
      )}
    </div>
  );
}

function QuickLink({ href, label, icon, warn = false }: { href: string; label: string; icon: string; warn?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
        warn
          ? "border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
          : "text-[var(--subtle)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
      }`}
    >
      <span className="w-4 text-center text-xs">{icon}</span>
      {label}
    </Link>
  );
}

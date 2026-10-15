import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminNavGroups } from "@/lib/admin-nav";
import { Pill, Section, TableCard, orderTone, roleTone } from "@/components/dashboard/pro";
import { Avatar } from "@/components/dashboard/pro";
import { getAdminTexts } from "@/i18n/admin";
import { getDashboardTexts } from "@/i18n/dashboard";
import { formatMoney } from "@/lib/money";
import { UUID_RE } from "@/lib/orders";
import { UserRoleManager } from "@/components/admin/user-role-manager";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: `Utilisateur ${id.slice(0, 8)} · Admin Toomny` };
}
export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const user = await requireAdmin();
  const locale = user.preferredLocale;
  const t = getAdminTexts(locale);
  const dashT = getDashboardTexts(locale);
  const db = createAdminClient();

  const [
    { data: profile },
    { data: providerProfile },
    { data: ordersAsClient },
    { data: ordersAsProvider },
    { data: kycs },
    { data: payouts },
  ] = await Promise.all([
    db.from("profiles").select("id, display_name, email, role, country_code, created_at").eq("id", id).maybeSingle(),
    db.from("provider_profiles").select("headline, plan, plan_expires_at, rating_avg, rating_count, completed_orders").eq("profile_id", id).maybeSingle(),
    db.from("orders").select("id, reference, status, amount_minor, currency, created_at").eq("client_id", id).order("created_at", { ascending: false }).limit(20),
    db.from("orders").select("id, reference, status, amount_minor, currency, created_at").eq("provider_id", id).order("created_at", { ascending: false }).limit(20),
    db.from("kyc_verifications").select("id, status, created_at, rejection_reason").eq("profile_id", id).order("created_at", { ascending: false }).limit(5),
    db.from("payouts").select("id, order_id, amount_minor, currency, status, created_at").eq("provider_id", id).order("created_at", { ascending: false }).limit(20),
  ]);

  if (!profile) notFound();

  const isProvider = profile.role === "provider" || profile.role === "both";
  const colRef = locale === "en" ? "Reference" : "Référence";
  const colStatus = locale === "en" ? "Status" : "Statut";
  const colDate = locale === "en" ? "Date" : "Date";
  const colAmount = locale === "en" ? "Amount" : "Montant";
  const backLabel = locale === "en" ? "← Back to users" : "← Retour aux utilisateurs";
  const titleKyc = locale === "en" ? "Identity checks" : "Vérifications KYC";
  const titleOrders = locale === "en" ? "Orders as client" : "Commandes (client)";
  const titleProvOrders = locale === "en" ? "Orders as provider" : "Commandes (prestataire)";
  const titlePayouts = locale === "en" ? "Payouts" : "Versements";
  const noneLabel = locale === "en" ? "None" : "Aucun";

  return (
    <AdminShell
      user={user}
      locale={locale}
      kicker="Administration"
      title={profile.display_name ?? profile.email ?? id.slice(0, 8)}
      subtitle={profile.email ?? "—"}
      nav={getAdminNavGroups(locale, "/admin/users")}
    >
      <div className="mb-6">
        <Link href="/admin/users" className="text-sm text-[var(--subtle)] hover:text-[var(--foreground)]">
          {backLabel}
        </Link>
      </div>

      {/* Profil */}
      <Section title={locale === "en" ? "Profile" : "Profil"}>
        <div className="flex flex-wrap items-start gap-6">
          <Avatar name={profile.display_name ?? profile.email ?? "?"} size="lg" />
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-[var(--subtle)]">{t.usersPage.colRole}</dt>
              <dd className="mt-0.5">
                <Pill tone={roleTone(profile.role)}>{t.roles[profile.role] ?? profile.role}</Pill>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--subtle)]">{t.usersPage.colCountry}</dt>
              <dd className="mt-0.5 font-semibold">{profile.country_code ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--subtle)]">{t.usersPage.colDate}</dt>
              <dd className="mt-0.5">{new Date(profile.created_at).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-GB")}</dd>
            </div>
            {isProvider && providerProfile && (
              <>
                <div>
                  <dt className="text-xs text-[var(--subtle)]">{locale === "en" ? "Plan" : "Plan"}</dt>
                  <dd className="mt-0.5 font-semibold capitalize">{providerProfile.plan ?? "debutant"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--subtle)]">{locale === "en" ? "Completed orders" : "Commandes terminées"}</dt>
                  <dd className="mt-0.5 font-semibold">{providerProfile.completed_orders ?? 0}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--subtle)]">{locale === "en" ? "Rating" : "Note"}</dt>
                  <dd className="mt-0.5 font-semibold">
                    {providerProfile.rating_avg ? `★ ${Number(providerProfile.rating_avg).toFixed(1)}` : "—"}
                    {providerProfile.rating_count ? ` (${providerProfile.rating_count})` : ""}
                  </dd>
                </div>
              </>
            )}
          </dl>
          <div className="ml-auto">
            <UserRoleManager userId={profile.id} currentRole={profile.role} locale={locale} />
          </div>
        </div>
      </Section>

      {/* KYC */}
      <Section title={titleKyc} className="mt-6">
        {!kycs || kycs.length === 0 ? (
          <p className="text-sm text-[var(--subtle)]">{noneLabel}</p>
        ) : (
          <TableCard>
            <thead>
              <tr>
                <th>{colStatus}</th>
                <th>{colDate}</th>
                <th>{locale === "en" ? "Rejection reason" : "Motif de rejet"}</th>
                <th className="text-right">{locale === "en" ? "Actions" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {kycs.map((k) => (
                <tr key={k.id}>
                  <td><Pill tone={k.status === "verified" ? "success" : k.status === "rejected" ? "danger" : "warning"}>{k.status}</Pill></td>
                  <td className="text-xs text-[var(--subtle)]">{new Date(k.created_at).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-GB")}</td>
                  <td className="text-xs text-[var(--subtle)]">{k.rejection_reason ?? "—"}</td>
                  <td className="text-right">
                    <Link href={`/admin/verifications`} className="btn-ghost btn-sm">{locale === "en" ? "View KYC" : "Voir KYC"}</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableCard>
        )}
      </Section>

      {/* Commandes en tant que client */}
      <Section title={titleOrders} className="mt-6">
        {!ordersAsClient || ordersAsClient.length === 0 ? (
          <p className="text-sm text-[var(--subtle)]">{noneLabel}</p>
        ) : (
          <TableCard>
            <thead>
              <tr>
                <th>{colRef}</th>
                <th>{colStatus}</th>
                <th>{colDate}</th>
                <th className="text-right">{colAmount}</th>
              </tr>
            </thead>
            <tbody>
              {ordersAsClient.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/orders/${o.id}`} className="font-semibold text-[var(--color-brand-600)] hover:underline">
                      {o.reference}
                    </Link>
                  </td>
                  <td><Pill tone={orderTone(o.status)}>{dashT.status[o.status] ?? o.status}</Pill></td>
                  <td className="text-xs text-[var(--subtle)]">{new Date(o.created_at).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-GB")}</td>
                  <td className="text-right font-display font-bold">{formatMoney(BigInt(o.amount_minor), o.currency, locale)}</td>
                </tr>
              ))}
            </tbody>
          </TableCard>
        )}
      </Section>

      {/* Commandes en tant que prestataire */}
      {isProvider && (
        <Section title={titleProvOrders} className="mt-6">
          {!ordersAsProvider || ordersAsProvider.length === 0 ? (
            <p className="text-sm text-[var(--subtle)]">{noneLabel}</p>
          ) : (
            <TableCard>
              <thead>
                <tr>
                  <th>{colRef}</th>
                  <th>{colStatus}</th>
                  <th>{colDate}</th>
                  <th className="text-right">{colAmount}</th>
                </tr>
              </thead>
              <tbody>
                {ordersAsProvider.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/orders/${o.id}`} className="font-semibold text-[var(--color-brand-600)] hover:underline">
                        {o.reference}
                      </Link>
                    </td>
                    <td><Pill tone={orderTone(o.status)}>{dashT.status[o.status] ?? o.status}</Pill></td>
                    <td className="text-xs text-[var(--subtle)]">{new Date(o.created_at).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-GB")}</td>
                    <td className="text-right font-display font-bold">{formatMoney(BigInt(o.amount_minor), o.currency, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </TableCard>
          )}
        </Section>
      )}

      {/* Versements */}
      {isProvider && (
        <Section title={titlePayouts} className="mt-6">
          {!payouts || payouts.length === 0 ? (
            <p className="text-sm text-[var(--subtle)]">{noneLabel}</p>
          ) : (
            <TableCard>
              <thead>
                <tr>
                  <th>{locale === "en" ? "Order" : "Commande"}</th>
                  <th>{colStatus}</th>
                  <th>{colDate}</th>
                  <th className="text-right">{colAmount}</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/orders/${p.order_id}`} className="font-semibold text-[var(--color-brand-600)] hover:underline">
                        {p.order_id.slice(0, 8)}
                      </Link>
                    </td>
                    <td><Pill tone={p.status === "paid" ? "success" : p.status === "failed" ? "danger" : "warning"}>{p.status}</Pill></td>
                    <td className="text-xs text-[var(--subtle)]">{new Date(p.created_at).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-GB")}</td>
                    <td className="text-right font-display font-bold">{formatMoney(BigInt(p.amount_minor), p.currency, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </TableCard>
          )}
        </Section>
      )}
    </AdminShell>
  );
}

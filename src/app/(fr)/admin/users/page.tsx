import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { DashboardShell, EmptyState } from "@/components/dashboard/shell";
import { getAdminTexts } from "@/i18n/admin";
import { getMarketplaceTexts } from "@/i18n/marketplace";
import { visitorLocale } from "@/i18n/server-locale";
import { UserRoleManager } from "@/components/admin/user-role-manager";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getAdminTexts(await visitorLocale()).usersPage.metaTitle };
}
export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const user = await requireAdmin();
  const locale = user.preferredLocale;
  const t = getAdminTexts(locale).usersPage;
  const nav = getAdminTexts(locale).nav;
  const roles = getAdminTexts(locale).roles;
  const { role: rawRole } = await searchParams;

  const VALID_ROLES = ["client", "provider", "admin"];
  const filterRole = VALID_ROLES.includes(rawRole ?? "") ? rawRole! : null;

  const db = createAdminClient();
  let query = db
    .from("profiles")
    .select("id, display_name, email, role, country_code, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (filterRole) query = query.eq("role", filterRole);

  const { data: users } = await query;
  const list = users ?? [];

  const filters = [
    { key: null, label: t.filterAll },
    { key: "client", label: t.filterClient },
    { key: "provider", label: t.filterProvider },
    { key: "admin", label: t.filterAdmin },
  ];

  return (
    <DashboardShell
      user={user}
      locale={locale}
      title={t.title}
      subtitle={`${t.subtitle} — ${list.length} compte${list.length !== 1 ? "s" : ""}`}
      nav={[
        { href: "/admin", label: nav.overview },
        { href: "/admin/verifications", label: nav.kyc },
        { href: "/admin/services", label: nav.services },
        { href: "/admin/categories", label: nav.categories },
        { href: "/admin/users", label: nav.users, current: true },
        { href: "/admin/orders", label: nav.orders },
        { href: "/admin/disputes", label: getMarketplaceTexts(locale).nav.disputes },
        { href: "/dashboard", label: nav.myDashboard },
      ]}
    >
      <div className="mb-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <a
            key={f.key ?? "all"}
            href={f.key ? `/admin/users?role=${f.key}` : "/admin/users"}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              filterRole === f.key
                ? "bg-[var(--color-brand-500)] text-white"
                : "border border-[var(--border)] bg-[var(--background)] text-[var(--subtle)]"
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState title={t.emptyTitle} body={t.emptyBody} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--subtle)]">
              <tr>
                <th className="px-5 py-3 font-medium">{t.colName}</th>
                <th className="px-5 py-3 font-medium">{t.colRole}</th>
                <th className="px-5 py-3 font-medium">{t.colCountry}</th>
                <th className="px-5 py-3 font-medium">{t.colDate}</th>
                <th className="px-5 py-3 font-medium text-right">{t.changeRole}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((u, i) => (
                <tr key={u.id} className={i < list.length - 1 ? "border-b border-[var(--border)]" : ""}>
                  <td className="px-5 py-3.5">
                    <p className="font-medium">{u.display_name ?? "—"}</p>
                    <p className="text-xs text-[var(--subtle)]">{u.email}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      u.role === "admin"
                        ? "bg-amber-50 text-amber-700"
                        : u.role === "provider"
                        ? "bg-[var(--color-brand-50)] text-[var(--color-brand-700)]"
                        : "bg-[var(--surface)] text-[var(--subtle)]"
                    }`}>
                      {roles[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[var(--subtle)]">{u.country_code ?? "—"}</td>
                  <td className="px-5 py-3.5 text-[var(--subtle)] text-xs">
                    {new Date(u.created_at).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-GB")}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <UserRoleManager userId={u.id} currentRole={u.role} locale={locale} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}

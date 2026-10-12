import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { EmptyState } from "@/components/dashboard/shell";
import { Avatar, FilterTabs, Pill, TableCard, roleTone } from "@/components/dashboard/pro";
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

  function filterHref(key: string | null) {
    return key ? `/admin/users?role=${key}` : "/admin/users";
  }

  return (
    <AdminShell
      user={user}
      locale={locale}
      kicker="Administration"
      title={t.title}
      subtitle={`${t.subtitle} — ${list.length} compte${list.length !== 1 ? "s" : ""}`}
      nav={[
        { href: "/admin", label: nav.overview },
        { href: "/admin/verifications", label: nav.kyc },
        { href: "/admin/services", label: nav.services },
        { href: "/admin/categories", label: nav.categories },
        { href: "/admin/users", label: nav.users, current: true },
        { href: "/admin/orders", label: nav.orders },
        { href: "/admin/payouts", label: nav.payouts },
        { href: "/admin/disputes", label: getMarketplaceTexts(locale).nav.disputes },
        { href: "/dashboard", label: nav.myDashboard },
      ]}
    >
      <FilterTabs
        items={filters.map((f) => ({
          href: filterHref(f.key),
          label: f.label,
          current: filterRole === f.key,
        }))}
      />

      {list.length === 0 ? (
        <EmptyState title={t.emptyTitle} body={t.emptyBody} />
      ) : (
        <TableCard>
          <thead>
            <tr>
              <th>{t.colName}</th>
              <th>{t.colRole}</th>
              <th>{t.colCountry}</th>
              <th>{t.colDate}</th>
              <th className="text-right">{t.changeRole}</th>
            </tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id}>
                <td className="whitespace-normal!">
                  <span className="flex items-center gap-3">
                    <Avatar name={u.display_name ?? u.email} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{u.display_name ?? "—"}</span>
                      <span className="block truncate text-xs text-[var(--subtle)]">{u.email}</span>
                    </span>
                  </span>
                </td>
                <td>
                  <Pill tone={roleTone(u.role)}>{roles[u.role] ?? u.role}</Pill>
                </td>
                <td className="text-[var(--subtle)]">{u.country_code ?? "—"}</td>
                <td className="text-xs text-[var(--subtle)]">
                  {new Date(u.created_at).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-GB")}
                </td>
                <td className="text-right">
                  <UserRoleManager userId={u.id} currentRole={u.role} locale={locale} />
                </td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      )}
    </AdminShell>
  );
}

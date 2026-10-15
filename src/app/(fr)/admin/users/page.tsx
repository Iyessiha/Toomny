import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminNavGroups } from "@/lib/admin-nav";
import { EmptyState } from "@/components/dashboard/shell";
import { Avatar, FilterTabs, Pill, TableCard, roleTone } from "@/components/dashboard/pro";
import { getAdminTexts } from "@/i18n/admin";
import { visitorLocale } from "@/i18n/server-locale";
import { UserRoleManager } from "@/components/admin/user-role-manager";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getAdminTexts(await visitorLocale()).usersPage.metaTitle };
}
export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string }>;
}) {
  const user = await requireAdmin();
  const locale = user.preferredLocale;
  const t = getAdminTexts(locale).usersPage;
  const roles = getAdminTexts(locale).roles;
  const { role: rawRole, q: rawQ } = await searchParams;
  const searchQuery = rawQ?.trim() ?? "";

  const VALID_ROLES = ["client", "provider", "both", "admin"];
  const filterRole = VALID_ROLES.includes(rawRole ?? "") ? rawRole! : null;

  const db = createAdminClient();
  let query = db
    .from("profiles")
    .select("id, display_name, email, role, country_code, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (filterRole) query = query.eq("role", filterRole);

  const { data: users } = await query;
  let list = users ?? [];

  if (searchQuery) {
    const lower = searchQuery.toLowerCase();
    list = list.filter(
      (u) =>
        u.display_name?.toLowerCase().includes(lower) ||
        u.email?.toLowerCase().includes(lower),
    );
  }

  const filters = [
    { key: null, label: t.filterAll },
    { key: "client", label: t.filterClient },
    { key: "provider", label: t.filterProvider },
    { key: "both", label: t.filterBoth },
    { key: "admin", label: t.filterAdmin },
  ];

  function filterHref(key: string | null) {
    const base = key ? `/admin/users?role=${key}` : "/admin/users";
    return searchQuery ? `${base}${key ? "&" : "?"}q=${encodeURIComponent(searchQuery)}` : base;
  }

  return (
    <AdminShell
      user={user}
      locale={locale}
      kicker="Administration"
      title={t.title}
      subtitle={`${t.subtitle} — ${list.length} compte${list.length !== 1 ? "s" : ""}`}
      nav={getAdminNavGroups(locale, "/admin/users")}
    >
      <form method="GET" action="/admin/users" className="mb-4 flex items-center gap-2">
        {filterRole && <input type="hidden" name="role" value={filterRole} />}
        <input
          type="search"
          name="q"
          defaultValue={searchQuery}
          placeholder={t.searchPlaceholder}
          className="input flex-1 max-w-sm"
        />
        <button type="submit" className="btn-primary btn-sm">
          {locale === "en" ? "Search" : "Rechercher"}
        </button>
      </form>

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
                  <Link href={`/admin/users/${u.id}`} className="flex items-center gap-3 hover:underline">
                    <Avatar name={u.display_name ?? u.email} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-[var(--color-brand-600)]">{u.display_name ?? "—"}</span>
                      <span className="block truncate text-xs text-[var(--subtle)]">{u.email}</span>
                    </span>
                  </Link>
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

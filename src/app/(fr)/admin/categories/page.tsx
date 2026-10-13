import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminTexts } from "@/i18n/admin";
import { getMarketplaceTexts } from "@/i18n/marketplace";
import { visitorLocale } from "@/i18n/server-locale";
import { CategoryManager } from "@/components/admin/category-manager";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getAdminTexts(await visitorLocale()).categoriesPage.metaTitle };
}
export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const user = await requireAdmin();
  const locale = user.preferredLocale;
  const t = getAdminTexts(locale).categoriesPage;
  const nav = getAdminTexts(locale).nav;

  const db = createAdminClient();
  const { data: categories } = await db
    .from("categories")
    .select("id, slug, name_fr, name_en, position, is_active")
    .order("position", { ascending: true });

  return (
    <AdminShell
      user={user}
      locale={locale}
      title={t.title}
      subtitle={t.subtitle}
      nav={[
        { href: "/admin", label: nav.overview },
        { href: "/admin/verifications", label: nav.kyc },
        { href: "/admin/services", label: nav.services },
        { href: "/admin/categories", label: nav.categories, current: true },
        { href: "/admin/users", label: nav.users },
        { href: "/admin/orders", label: nav.orders },
        { href: "/admin/disputes", label: getMarketplaceTexts(locale).nav.disputes },
        { href: "/dashboard", label: nav.myDashboard },
      ]}
    >
      <CategoryManager categories={categories ?? []} locale={locale} />
    </AdminShell>
  );
}

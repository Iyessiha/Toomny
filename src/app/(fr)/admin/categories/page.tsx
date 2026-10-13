import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminNavGroups } from "@/lib/admin-nav";
import { getAdminTexts } from "@/i18n/admin";
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

  const db = createAdminClient();
  const { data: categories } = await db
    .from("categories")
    .select("id, slug, name_fr, name_en, position, is_active")
    .order("position", { ascending: true });

  return (
    <AdminShell
      user={user}
      locale={locale}
      kicker="Administration"
      title={t.title}
      subtitle={t.subtitle}
      nav={getAdminNavGroups(locale, "/admin/categories")}
    >
      <CategoryManager categories={categories ?? []} locale={locale} />
    </AdminShell>
  );
}

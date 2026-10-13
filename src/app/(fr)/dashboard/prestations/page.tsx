import type { Metadata } from "next";
import Link from "next/link";
import { getPublicPageTexts } from "@/i18n/public-pages";
import { visitorLocale } from "@/i18n/server-locale";
import { redirect } from "next/navigation";
import { requireAuth, isProvider } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/catalog";
import { DashboardShell } from "@/components/dashboard/shell";
import { dashboardNavSections } from "@/lib/dashboard-nav";
import { ServiceManage } from "@/components/dashboard/service-manage";
import { getDashboardTexts } from "@/i18n/dashboard";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getPublicPageTexts(await visitorLocale()).titles.services };
}
export const dynamic = "force-dynamic";

export default async function PrestationsPage() {
  const user = await requireAuth();
  if (!isProvider(user.role)) redirect("/dashboard");
  const locale = user.preferredLocale;
  const t = getDashboardTexts(locale).services;
  const nav = getDashboardTexts(locale).nav;

  const supabase = await createClient();
  const [{ data: services }, categories] = await Promise.all([
    supabase
      .from("services")
      .select("id, title, description, price_minor, currency, delivery_days, status, category_id, cover_url, gallery_urls, tags, created_at")
      .eq("provider_id", user.id)
      .order("created_at", { ascending: false }),
    getCategories(),
  ]);

  const list = services ?? [];

  const serviceIds = list.map((s) => s.id);
  const { data: allPackages } = serviceIds.length
    ? await supabase
        .from("service_packages")
        .select("id, service_id, tier, name, description, price_minor, delivery_days, currency")
        .in("service_id", serviceIds)
        .order("tier")
    : { data: [] };

  const packagesByService: Record<string, { id: string; tier: 1 | 2 | 3; name: string; description: string | null; price_minor: number; delivery_days: number; currency: string }[]> = {};
  for (const pkg of allPackages ?? []) {
    const p = pkg as typeof pkg & { tier: 1 | 2 | 3 };
    (packagesByService[p.service_id] ??= []).push(p);
  }

  return (
    <DashboardShell
      user={user}
      kicker={nav.services}
      title={t.title}
      subtitle={t.subtitle}
      locale={locale}
      navSections={dashboardNavSections(nav, user.role, "/dashboard/prestations")}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold">{t.listTitle}</h2>
        <Link href="/dashboard/prestations/nouveau" className="btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {t.newTitle}
        </Link>
      </div>
      <ServiceManage
        services={list}
        categories={categories.map((c) => ({ id: c.id, name: locale === "en" ? c.name_en : c.name_fr }))}
        locale={locale}
        packagesByService={packagesByService}
      />
    </DashboardShell>
  );
}

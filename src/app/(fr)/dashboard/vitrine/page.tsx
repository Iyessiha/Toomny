import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAuth, isProvider } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { DashboardShell } from "@/components/dashboard/shell";
import { dashboardNavSections } from "@/lib/dashboard-nav";
import { ShowcaseManager, type PortfolioRow } from "@/components/dashboard/showcase-manager";
import { ShareProfile } from "@/components/dashboard/share-profile";
import { MAX_PORTFOLIO_ITEMS } from "@/lib/portfolio";
import { getShowcaseTexts } from "@/i18n/showcase";
import { getDashboardTexts } from "@/i18n/dashboard";

export const metadata: Metadata = { title: "Ma vitrine · Toomny", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ShowcasePage() {
  const user = await requireAuth();
  if (!isProvider(user.role)) redirect("/dashboard");
  const locale = user.preferredLocale;
  const t = getShowcaseTexts(locale);
  const nav = getDashboardTexts(locale).nav;

  const db = createAdminClient();
  const [{ data: profile }, { data: items }] = await Promise.all([
    db.from("provider_profiles").select("business_type, company_name").eq("profile_id", user.id).maybeSingle(),
    db.from("portfolio_items").select("id, kind, title, description, url").eq("provider_id", user.id).order("created_at", { ascending: true }),
  ]);

  const rows: PortfolioRow[] = (items ?? []).map((i) => ({
    id: i.id as string,
    kind: i.kind as string,
    title: i.title as string,
    description: (i.description as string | null) ?? null,
    url: i.url as string,
  }));

  return (
    <DashboardShell
      user={user}
      title={t.pageTitle}
      subtitle={t.pageSubtitle}
      locale={locale}
      navSections={dashboardNavSections(nav, user.role, "/dashboard/vitrine")}
    >
      <div className="mb-8">
        <ShareProfile
          locale={locale}
          siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? "https://toomny.com"}
          profileUrl={`/prestataires/${user.id}`}
          name={user.displayName ?? t.pageTitle}
        />
      </div>
      <ShowcaseManager
        texts={t}
        businessType={profile?.business_type === "company" ? "company" : "individual"}
        companyName={(profile?.company_name as string | null) ?? ""}
        items={rows}
        limit={MAX_PORTFOLIO_ITEMS}
      />
    </DashboardShell>
  );
}

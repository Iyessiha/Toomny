import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminNavGroups } from "@/lib/admin-nav";
import { getAdminTexts } from "@/i18n/admin";
import { visitorLocale } from "@/i18n/server-locale";
import { PlanManager } from "@/components/admin/plan-manager";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getAdminTexts(await visitorLocale()).plansPage.metaTitle };
}
export const dynamic = "force-dynamic";

export default async function AdminPlansPage() {
  const user = await requireAdmin();
  const locale = user.preferredLocale;
  const t = getAdminTexts(locale).plansPage;

  const db = createAdminClient();

  const { data: ppRows } = await db
    .from("provider_profiles")
    .select("profile_id, plan, plan_expires_at")
    .order("plan", { ascending: false })
    .limit(500);

  const profileIds = (ppRows ?? []).map((r) => r.profile_id as string);
  const { data: profileRows } = profileIds.length
    ? await db
        .from("profiles")
        .select("id, display_name, email")
        .in("id", profileIds)
    : { data: [] };

  const profileMap = new Map(
    (profileRows ?? []).map((p) => [p.id as string, p])
  );

  const providers = (ppRows ?? []).map((row) => {
    const profile = profileMap.get(row.profile_id as string);
    return {
      id: row.profile_id as string,
      display_name: (profile?.display_name ?? null) as string | null,
      email: (profile?.email ?? null) as string | null,
      plan: (row.plan ?? "debutant") as string,
      plan_expires_at: (row.plan_expires_at ?? null) as string | null,
    };
  });

  return (
    <AdminShell
      user={user}
      locale={locale}
      kicker="Administration"
      title={t.title}
      subtitle={`${t.subtitle} — ${providers.length} prestataire${providers.length !== 1 ? "s" : ""}`}
      nav={getAdminNavGroups(locale, "/admin/plans")}
    >
      <PlanManager providers={providers} locale={locale} />
    </AdminShell>
  );
}

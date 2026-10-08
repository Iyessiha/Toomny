import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { DashboardShell, EmptyState } from "@/components/dashboard/shell";
import { KycReviewCard } from "@/components/admin/kyc-review-card";
import { getAdminTexts } from "@/i18n/admin";
import { visitorLocale } from "@/i18n/server-locale";
import { getMarketplaceTexts } from "@/i18n/marketplace";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getAdminTexts(await visitorLocale()).kycPage.metaTitle };
}
export const dynamic = "force-dynamic";

type FilterStatus = "pending" | "manual_review" | "verified" | "rejected" | "all";

export default async function AdminVerificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireAdmin();
  const locale = user.preferredLocale;
  const t = getAdminTexts(locale);
  const db = createAdminClient();

  const params = await searchParams;
  const filter: FilterStatus = (params.status as FilterStatus) ?? "pending";

  let query = db
    .from("verifications")
    .select(`
      id, status, document_type, document_country, storage_path,
      rejection_reason, declared_first_name, declared_last_name, declared_dob,
      created_at,
      profile:profiles!profile_id (
        id, display_name, email, country_code, role
      )
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  if (filter !== "all") query = query.eq("status", filter);

  const { data: verifications } = await query;

  const [{ count: pending }, { count: manual }, { count: total }] = await Promise.all([
    db.from("verifications").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db.from("verifications").select("id", { count: "exact", head: true }).eq("status", "manual_review"),
    db.from("verifications").select("id", { count: "exact", head: true }),
  ]);

  const waiting = (pending ?? 0) + (manual ?? 0);
  const tabs: { label: string; value: FilterStatus; count?: number }[] = [
    { label: t.kycPage.tabs.pending, value: "pending", count: pending ?? 0 },
    { label: t.kycPage.tabs.manual_review, value: "manual_review", count: manual ?? 0 },
    { label: t.kycPage.tabs.verified, value: "verified" },
    { label: t.kycPage.tabs.rejected, value: "rejected" },
    { label: t.kycPage.tabs.all, value: "all", count: total ?? 0 },
  ];

  return (
    <DashboardShell
      user={user}
      locale={locale}
      title={t.kycPage.title}
      subtitle={t.kycPage.subtitle}
      nav={[
        { href: "/admin", label: t.nav.overview },
        { href: "/admin/verifications", label: t.nav.kyc, current: true },
        { href: "/admin/services", label: t.nav.services },
        { href: "/admin/orders", label: t.nav.orders },
        { href: "/admin/disputes", label: getMarketplaceTexts(locale).nav.disputes },
        { href: "/dashboard", label: t.nav.myDashboard },
      ]}
    >
      {waiting > 0 && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          <strong>{waiting}</strong> {waiting > 1 ? t.kycPage.attention : t.kycPage.attentionOne}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <a
            key={tab.value}
            href={`/admin/verifications?status=${tab.value}`}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filter === tab.value
                ? "bg-[var(--color-brand-500)] text-white"
                : "border border-[var(--border)] bg-[var(--background)] text-[var(--subtle)] hover:text-[var(--foreground)]"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${filter === tab.value ? "bg-white/20 text-white" : "bg-[var(--surface)] text-[var(--subtle)]"}`}>
                {tab.count}
              </span>
            )}
          </a>
        ))}
      </div>

      {!verifications || verifications.length === 0 ? (
        <EmptyState
          title={t.kycPage.emptyTitle}
          body={filter === "all" ? t.kycPage.emptyBody : t.kycPage.emptyBodyStatus.replace("{status}", t.kycPage.tabs[filter] ?? filter)}
        />
      ) : (
        <div className="space-y-4">
          {verifications.map((v) => (
            <KycReviewCard
              key={v.id}
              locale={locale}
              verif={{
                ...v,
                declared_first_name: (v as { declared_first_name?: string | null }).declared_first_name ?? null,
                declared_last_name: (v as { declared_last_name?: string | null }).declared_last_name ?? null,
                declared_dob: (v as { declared_dob?: string | null }).declared_dob ?? null,
                profile: Array.isArray(v.profile) ? v.profile[0] ?? null : v.profile,
              }}
            />
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

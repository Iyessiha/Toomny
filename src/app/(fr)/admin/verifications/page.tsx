import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminNavGroups } from "@/lib/admin-nav";
import { EmptyState } from "@/components/dashboard/shell";
import { KycReviewCard } from "@/components/admin/kyc-review-card";
import { FilterTabs, Notice } from "@/components/dashboard/pro";
import { getAdminTexts } from "@/i18n/admin";
import { visitorLocale } from "@/i18n/server-locale";

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
    <AdminShell
      user={user}
      locale={locale}
      kicker="Administration"
      title={t.kycPage.title}
      subtitle={t.kycPage.subtitle}
      nav={getAdminNavGroups(locale, "/admin/verifications")}
    >
      {waiting > 0 && (
        <div className="mb-6">
          <Notice tone="warning">
            <strong>{waiting}</strong>{" "}
            {waiting > 1 ? t.kycPage.attention : t.kycPage.attentionOne}
          </Notice>
        </div>
      )}

      <FilterTabs
        items={tabs.map((tab) => ({
          href: `/admin/verifications?status=${tab.value}`,
          label: tab.label,
          current: filter === tab.value,
          count: tab.count,
        }))}
      />

      {!verifications || verifications.length === 0 ? (
        <EmptyState
          title={t.kycPage.emptyTitle}
          body={filter === "all" ? t.kycPage.emptyBody : t.kycPage.emptyBodyStatus.replace("{status}", t.kycPage.tabs[filter] ?? filter)}
        />
      ) : (
        <div className="space-y-4">
          {(verifications as {
            id: string; status: string; document_type: string; document_country: string;
            storage_path: string; rejection_reason: string | null;
            declared_first_name?: string | null; declared_last_name?: string | null; declared_dob?: string | null;
            created_at: string;
            profile: { id: string; display_name: string | null; email: string; country_code: string; role: string } | { id: string; display_name: string | null; email: string; country_code: string; role: string }[] | null;
          }[]).map((v) => (
            <KycReviewCard
              key={v.id}
              locale={locale}
              verif={{
                id: v.id,
                status: v.status,
                document_type: v.document_type,
                document_country: v.document_country,
                storage_path: v.storage_path,
                rejection_reason: v.rejection_reason,
                declared_first_name: v.declared_first_name ?? null,
                declared_last_name: v.declared_last_name ?? null,
                declared_dob: v.declared_dob ?? null,
                created_at: v.created_at,
                profile: Array.isArray(v.profile) ? v.profile[0] ?? null : v.profile,
              }}
            />
          ))}
        </div>
      )}
    </AdminShell>
  );
}

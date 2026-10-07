import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { DashboardShell } from "@/components/dashboard/shell";
import { KycReviewCard } from "@/components/admin/kyc-review-card";
import { EmptyState } from "@/components/dashboard/shell";
import { VERIFICATION_STATUS_FR, VERIFICATION_STATUS_TONE } from "@/lib/kyc";

export const metadata: Metadata = { title: "Vérifications KYC · Admin Toomny" };
export const dynamic = "force-dynamic";

type FilterStatus = "pending" | "manual_review" | "verified" | "rejected" | "all";

export default async function AdminVerificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireAdmin();
  const db = createAdminClient();

  const params = await searchParams;
  const filter: FilterStatus = (params.status as FilterStatus) ?? "pending";

  // Charger les demandes avec le profil de l'utilisateur
  let query = db
    .from("verifications")
    .select(`
      id, status, document_type, document_country, storage_path,
      rejection_reason, created_at,
      profile:profiles!profile_id (
        id, display_name, email, country_code, role
      )
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  if (filter !== "all") {
    query = query.eq("status", filter);
  }

  const { data: verifications } = await query;

  // Compteurs par statut
  const [{ count: pending }, { count: manual }, { count: total }] = await Promise.all([
    db.from("verifications").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db.from("verifications").select("id", { count: "exact", head: true }).eq("status", "manual_review"),
    db.from("verifications").select("id", { count: "exact", head: true }),
  ]);

  const tabs: { label: string; value: FilterStatus; count?: number }[] = [
    { label: "En attente", value: "pending", count: pending ?? 0 },
    { label: "Revue manuelle", value: "manual_review", count: manual ?? 0 },
    { label: "Approuvés", value: "verified" },
    { label: "Rejetés", value: "rejected" },
    { label: "Tous", value: "all", count: total ?? 0 },
  ];

  return (
    <DashboardShell
      user={user}
      title="Vérifications KYC"
      subtitle="Examinez et traitez les demandes de vérification d'identité"
      nav={[
        { href: "/admin", label: "Vue d'ensemble" },
        { href: "/admin/verifications", label: "Vérifications KYC", current: true },
      ]}
    >
      {/* Alerte si dossiers urgents */}
      {(pending ?? 0) + (manual ?? 0) > 0 && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          <strong>{(pending ?? 0) + (manual ?? 0)} dossier{((pending ?? 0) + (manual ?? 0)) > 1 ? "s" : ""}</strong> nécessitent votre attention.
        </div>
      )}

      {/* Filtres */}
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
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                  filter === tab.value ? "bg-white/20 text-white" : "bg-[var(--surface)] text-[var(--subtle)]"
                }`}
              >
                {tab.count}
              </span>
            )}
          </a>
        ))}
      </div>

      {/* Liste des dossiers */}
      {!verifications || verifications.length === 0 ? (
        <EmptyState
          title="Aucun dossier"
          body={`Aucune demande ${filter === "all" ? "" : `avec le statut « ${VERIFICATION_STATUS_FR[filter] ?? filter} »`} pour l'instant.`}
        />
      ) : (
        <div className="space-y-4">
          {verifications.map((v) => (
            <KycReviewCard
              key={v.id}
              verif={{
                ...v,
                profile: Array.isArray(v.profile) ? v.profile[0] ?? null : v.profile,
              }}
            />
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

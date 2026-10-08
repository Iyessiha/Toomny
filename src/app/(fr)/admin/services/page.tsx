import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { DashboardShell, EmptyState } from "@/components/dashboard/shell";
import { formatMoney } from "@/lib/money";
import { moderateService } from "./actions";

export const metadata: Metadata = { title: "Modération des prestations · Admin Toomny" };
export const dynamic = "force-dynamic";

const TABS = [
  { value: "draft", label: "Brouillons" },
  { value: "active", label: "Publiées" },
  { value: "paused", label: "En pause" },
  { value: "removed", label: "Retirées" },
] as const;

const STATUS_FR: Record<string, string> = {
  draft: "Brouillon",
  active: "Publiée",
  paused: "En pause",
  removed: "Retirée",
};

export default async function AdminServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireAdmin();
  const { status: rawStatus } = await searchParams;
  const status = TABS.some((t) => t.value === rawStatus) ? (rawStatus as string) : "draft";

  const db = createAdminClient();
  const { data: rows } = await db
    .from("services")
    .select(
      "id, title, price_minor, currency, delivery_days, status, created_at, provider:profiles!services_provider_id_profiles_id_fk(display_name, email), category:categories(name_fr)",
    )
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(100);

  const list = (rows ?? []).map((r) => {
    const provider = Array.isArray(r.provider) ? r.provider[0] : r.provider;
    const category = Array.isArray(r.category) ? r.category[0] : r.category;
    return { ...r, provider, category };
  });

  return (
    <DashboardShell
      user={user}
      title="Modération des prestations"
      subtitle="Une prestation n'apparaît au catalogue qu'après publication ici"
      nav={[
        { href: "/admin", label: "Vue d'ensemble" },
        { href: "/admin/verifications", label: "Vérifications KYC" },
        { href: "/admin/services", label: "Prestations", current: true },
        { href: "/dashboard", label: "Mon tableau de bord" },
      ]}
    >
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <a
            key={t.value}
            href={`/admin/services?status=${t.value}`}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              status === t.value
                ? "bg-[var(--color-brand-500)] text-white"
                : "border border-[var(--border)] bg-[var(--background)] text-[var(--subtle)]"
            }`}
          >
            {t.label}
          </a>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState title="Rien à traiter" body="Aucune prestation dans cette catégorie de statut." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--subtle)]">
              <tr>
                <th className="px-5 py-3 font-medium">Prestation</th>
                <th className="px-5 py-3 font-medium">Prestataire</th>
                <th className="px-5 py-3 text-right font-medium">Prix</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((s, i) => (
                <tr key={s.id} className={i < list.length - 1 ? "border-b border-[var(--border)]" : ""}>
                  <td className="px-5 py-4">
                    <p className="font-medium">{s.title}</p>
                    <p className="text-xs text-[var(--subtle)]">
                      {s.category?.name_fr ?? "—"} · {s.delivery_days} j · {STATUS_FR[s.status] ?? s.status}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-[var(--subtle)]">
                    {s.provider?.display_name ?? "—"}
                    <p className="text-xs">{s.provider?.email}</p>
                  </td>
                  <td className="px-5 py-4 text-right font-display font-bold">
                    {formatMoney(BigInt(s.price_minor), s.currency, "fr")}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap justify-end gap-2">
                      {s.status !== "active" && (
                        <ModerationButton serviceId={s.id} status="active" label="Publier" primary />
                      )}
                      {s.status === "active" && (
                        <ModerationButton serviceId={s.id} status="paused" label="Mettre en pause" />
                      )}
                      {s.status !== "removed" && (
                        <ModerationButton serviceId={s.id} status="removed" label="Retirer" />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}

function ModerationButton({
  serviceId,
  status,
  label,
  primary = false,
}: {
  serviceId: string;
  status: string;
  label: string;
  primary?: boolean;
}) {
  return (
    <form action={moderateService}>
      <input type="hidden" name="serviceId" value={serviceId} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
          primary
            ? "bg-[var(--color-brand-500)] text-white"
            : "border border-[var(--border)] text-[var(--subtle)] hover:text-[var(--foreground)]"
        }`}
      >
        {label}
      </button>
    </form>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAuth, isProvider } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/catalog";
import { DashboardShell, EmptyState } from "@/components/dashboard/shell";
import { formatMoney } from "@/lib/money";
import { ServiceForm } from "@/components/dashboard/service-form";

export const metadata: Metadata = { title: "Mes prestations · Toomny" };
export const dynamic = "force-dynamic";

const STATUS_FR: Record<string, string> = {
  draft: "Brouillon",
  active: "Publiée",
  paused: "En pause",
  removed: "Retirée",
};

export default async function PrestationsPage() {
  const user = await requireAuth();
  if (!isProvider(user.role)) redirect("/dashboard");

  const supabase = await createClient();
  const [{ data: services }, categories] = await Promise.all([
    supabase
      .from("services")
      .select("id, title, price_minor, currency, delivery_days, status, created_at")
      .eq("provider_id", user.id)
      .order("created_at", { ascending: false }),
    getCategories(),
  ]);

  const list = services ?? [];

  return (
    <DashboardShell
      user={user}
      title="Mes prestations"
      subtitle="Ce que vous proposez aux clients"
      nav={[
        { href: "/dashboard", label: "Vue d'ensemble" },
        { href: "/dashboard/prestations", label: "Mes prestations", current: true },
        { href: "/dashboard/profil", label: "Mon profil" },
        { href: "/orders", label: "Commandes" },
        { href: "/messages", label: "Messages" },
      ]}
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <section>
          <h2 className="font-display text-lg font-bold">Vos prestations</h2>
          {list.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="Aucune prestation"
                body="Créez votre première offre à droite. Elle reste en brouillon jusqu'à validation par l'équipe Toomny."
              />
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]">
              {list.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{s.title}</p>
                    <p className="mt-0.5 text-xs text-[var(--subtle)]">
                      Livraison en {s.delivery_days} j · {STATUS_FR[s.status] ?? s.status}
                    </p>
                  </div>
                  <p className="shrink-0 font-display font-bold">
                    {formatMoney(BigInt(s.price_minor), s.currency, "fr")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="font-display text-lg font-bold">Nouvelle prestation</h2>
          <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6">
            <ServiceForm categories={categories.map((c) => ({ id: c.id, name: c.name_fr }))} />
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}

import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { DashboardShell, EmptyState } from "@/components/dashboard/shell";
import { ORDER_STATUS_FR, statusTone } from "@/lib/dashboard";
import { formatMoney } from "@/lib/money";
import { confirmPaymentReceived } from "./actions";

export const metadata: Metadata = { title: "Commandes · Admin Toomny" };
export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const user = await requireAdmin();
  const db = createAdminClient();

  const { data } = await db
    .from("orders")
    .select("id, reference, status, amount_minor, currency, created_at")
    .in("status", ["pending_payment", "funded", "in_progress", "delivered", "disputed"])
    .order("created_at", { ascending: false })
    .limit(100);

  const list = data ?? [];

  return (
    <DashboardShell
      user={user}
      title="Commandes en cours"
      subtitle="Confirmez un paiement uniquement après l'avoir vérifié chez le partenaire agréé"
      nav={[
        { href: "/admin", label: "Vue d'ensemble" },
        { href: "/admin/verifications", label: "Vérifications KYC" },
        { href: "/admin/services", label: "Prestations" },
        { href: "/admin/orders", label: "Commandes", current: true },
        { href: "/dashboard", label: "Mon tableau de bord" },
      ]}
    >
      {list.length === 0 ? (
        <EmptyState title="Aucune commande en cours" body="Les commandes apparaîtront ici dès leur création." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--subtle)]">
              <tr>
                <th className="px-5 py-3 font-medium">Référence</th>
                <th className="px-5 py-3 font-medium">Statut</th>
                <th className="px-5 py-3 text-right font-medium">Montant</th>
                <th className="px-5 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {list.map((o, i) => (
                <tr key={o.id} className={i < list.length - 1 ? "border-b border-[var(--border)]" : ""}>
                  <td className="px-5 py-4 font-medium">{o.reference}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(o.status)}`}>
                      {ORDER_STATUS_FR[o.status] ?? o.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right font-display font-bold">{formatMoney(BigInt(o.amount_minor), o.currency, "fr")}</td>
                  <td className="px-5 py-4 text-right">
                    {o.status === "pending_payment" && (
                      <form action={confirmPaymentReceived}>
                        <input type="hidden" name="orderId" value={o.id} />
                        <button type="submit" className="rounded-full bg-[var(--color-brand-500)] px-3 py-1.5 text-xs font-semibold text-white">
                          Paiement reçu
                        </button>
                      </form>
                    )}
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

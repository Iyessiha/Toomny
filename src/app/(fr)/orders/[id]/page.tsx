import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/shell";
import { ORDER_STATUS_FR, statusTone } from "@/lib/dashboard";
import { formatMoney } from "@/lib/money";
import { UUID_RE, availableActions } from "@/lib/orders";
import { OrderControls } from "@/components/orders/order-controls";
import { MessageForm } from "@/components/orders/message-form";

export const metadata: Metadata = { title: "Commande · Toomny" };
export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  // RLS : seule une partie à la commande reçoit une ligne. Un autre compte obtient 404.
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, reference, status, amount_minor, provider_net_minor, currency, requirements, due_at, client_id, provider_id, created_at, service:services(title)")
    .eq("id", id)
    .maybeSingle();
  if (!order) notFound();

  const { data: messages } = await supabase
    .from("messages")
    .select("id, body, sender_id, created_at")
    .eq("order_id", id)
    .order("created_at", { ascending: true });

  const isClient = order.client_id === user.id;
  const isProvider = order.provider_id === user.id;
  const actions = availableActions(isClient, isProvider, order.status);
  const service = Array.isArray(order.service) ? order.service[0] : order.service;
  const amount = isProvider ? order.provider_net_minor : order.amount_minor;

  return (
    <DashboardShell
      user={user}
      title={order.reference}
      subtitle={service?.title ?? "Prestation"}
      nav={[
        { href: "/dashboard", label: "Vue d'ensemble" },
        { href: "/orders", label: "Commandes", current: true },
        { href: "/messages", label: "Messages" },
      ]}
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(order.status)}`}>
                {ORDER_STATUS_FR[order.status] ?? order.status}
              </span>
              <span className="font-display text-xl font-bold">
                {formatMoney(BigInt(amount), order.currency, "fr")}
                <span className="ml-2 text-xs font-normal text-[var(--subtle)]">{isProvider ? "net pour vous" : "TTC"}</span>
              </span>
            </div>
            <h2 className="mt-6 text-sm font-semibold">Besoin du client</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[var(--subtle)]">{order.requirements ?? "—"}</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold">Échanges</h2>
            <div className="mt-4 space-y-3">
              {(messages ?? []).length === 0 && <p className="text-sm text-[var(--subtle)]">Aucun message pour l&apos;instant.</p>}
              {(messages ?? []).map((m) => {
                const mine = m.sender_id === user.id;
                return (
                  <div key={m.id} className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${mine ? "ml-auto bg-[var(--color-brand-50)]" : "bg-[var(--surface)]"}`}>
                    <p className="whitespace-pre-line">{m.body}</p>
                    <p className="mt-1 text-xs text-[var(--subtle)]">{new Date(m.created_at).toLocaleString("fr-FR")}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-6">
              <MessageForm orderId={order.id} />
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6">
            <h2 className="font-display text-base font-bold">Actions</h2>
            <div className="mt-4">
              {actions.length > 0 ? (
                <OrderControls orderId={order.id} actions={actions} />
              ) : (
                <p className="text-sm text-[var(--subtle)]">Aucune action disponible pour le moment.</p>
              )}
            </div>
          </div>
          {order.status === "pending_payment" && (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              En attente de la confirmation du paiement. Le travail démarre une fois les fonds confirmés.
            </p>
          )}
        </aside>
      </div>
    </DashboardShell>
  );
}

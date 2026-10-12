import type { Metadata } from "next";
import { getPublicPageTexts } from "@/i18n/public-pages";
import { visitorLocale } from "@/i18n/server-locale";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/shell";
import { dashboardNavSections } from "@/lib/dashboard-nav";
import { Notice, Pill, Section, orderTone } from "@/components/dashboard/pro";
import { getDashboardTexts } from "@/i18n/dashboard";
import { formatMoney } from "@/lib/money";
import { UUID_RE, availableActions } from "@/lib/orders";
import { OrderControls } from "@/components/orders/order-controls";
import { MessageSection } from "@/components/orders/message-section";
import { PayButton } from "@/components/orders/pay-button";
import { ReviewForm } from "@/components/orders/review-form";
import { getMarketplaceTexts } from "@/i18n/marketplace";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getPublicPageTexts(await visitorLocale()).titles.order };
}
export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  const locale = user.preferredLocale;
  const t = getDashboardTexts(locale).orders;
  const nav = getDashboardTexts(locale).nav;
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

  // Avis : une fois par commande terminée, par le client seulement.
  const { data: existingReview } =
    isClient && order.status === "completed"
      ? await supabase.from("reviews").select("id").eq("order_id", id).maybeSingle()
      : { data: null };
  const reviewText = getMarketplaceTexts(locale).review;
  const actions = availableActions(isClient, isProvider, order.status);
  const service = Array.isArray(order.service) ? order.service[0] : order.service;
  const amount = isProvider ? order.provider_net_minor : order.amount_minor;

  return (
    <DashboardShell
      user={user}
      title={order.reference}
      subtitle={service?.title ?? t.detailSubtitleFallback}
      locale={locale}
      navSections={dashboardNavSections(nav, user.role, "/orders")}
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <Section
            title={t.requirements}
            action={
              <span className="flex items-center gap-3">
                <span className="font-display text-lg font-bold">
                  {formatMoney(BigInt(amount), order.currency, locale)}
                  <span className="ml-2 text-xs font-normal text-[var(--subtle)]">
                    {isProvider ? t.netLabel : t.ttc}
                  </span>
                </span>
                <Pill tone={orderTone(order.status)}>
                  {getDashboardTexts(locale).status[order.status] ?? order.status}
                </Pill>
              </span>
            }
          >
            <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--subtle)]">
              {order.requirements ?? t.noRequirements}
            </p>
          </Section>

          <MessageSection
            orderId={order.id}
            userId={user.id}
            initialMessages={messages ?? []}
            locale={locale}
          />
        </div>

        <aside className="space-y-4">
          {isClient && order.status === "completed" && (
            <Section title={reviewText.title}>
              {existingReview ? (
                <p className="text-sm text-[var(--subtle)]">{reviewText.alreadyDone}</p>
              ) : (
                <ReviewForm orderId={order.id} locale={locale} />
              )}
            </Section>
          )}

          <Section title={t.actions}>
            {actions.length > 0 ? (
              <OrderControls orderId={order.id} actions={actions} locale={locale} />
            ) : (
              <p className="text-sm text-[var(--subtle)]">{t.noActions}</p>
            )}
          </Section>
          {isClient && order.status === "pending_payment" && (
            <Notice tone="warning" title={t.pendingPayment}>
              <div className="mt-3">
                <PayButton
                  orderId={order.id}
                  labels={{ payNow: t.payNow, paying: t.paying, payError: t.payError }}
                />
              </div>
            </Notice>
          )}
        </aside>
      </div>
    </DashboardShell>
  );
}

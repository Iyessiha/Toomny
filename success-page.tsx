import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getDashboardTexts } from "@/i18n/dashboard";
import { getPublicPageTexts } from "@/i18n/public-pages";
import { visitorLocale } from "@/i18n/server-locale";
import { SuccessConfirmation } from "@/components/orders/success-confirmation";
import { UUID_RE } from "@/lib/orders";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Paiement confirmé · Toomny" };
}

export const dynamic = "force-dynamic";

export default async function OrderSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  const locale = user.preferredLocale;
  const { id } = await params;

  if (!UUID_RE.test(id)) notFound();

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, reference, amount_minor, client_charge_minor, currency, status, service:services(title)")
    .eq("id", id)
    .eq("client_id", user.id)
    .maybeSingle();

  if (!order) notFound();

  if (order.status !== "held" && order.status !== "completed") {
    redirect(`/orders/${id}`);
  }

  const amount = order.client_charge_minor ?? order.amount_minor;
  const service = Array.isArray(order.service) ? order.service[0] : order.service;
  const t = getDashboardTexts(locale);

  return (
    <SuccessConfirmation
      orderId={id}
      reference={order.reference}
      amount={amount}
      currency={order.currency}
      serviceName={service?.title ?? t.orders.detailSubtitleFallback}
      locale={locale}
    />
  );
}

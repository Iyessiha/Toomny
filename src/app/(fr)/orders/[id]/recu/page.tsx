import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UUID_RE } from "@/lib/orders";
import { loadReceipt } from "@/lib/receipt";
import { formatReceiptDate } from "@/lib/receipt-format";
import { formatMoney } from "@/lib/money";
import { getReceiptTexts } from "@/i18n/receipt";
import { PrintButton } from "@/components/orders/print-button";

export const metadata: Metadata = { title: "Reçu de paiement — Toomny", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  const t = getReceiptTexts(user.preferredLocale);
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  // RLS : seul un participant voit la commande. Le reçu est réservé au client qui a payé.
  const supabase = await createClient();
  const { data: order } = await supabase.from("orders").select("id, client_id").eq("id", id).maybeSingle();
  if (!order || order.client_id !== user.id) notFound();

  const receipt = await loadReceipt(createAdminClient(), id);
  if (!receipt) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <p className="text-sm text-[var(--subtle)]">{t.notAvailable}</p>
        <Link href={`/orders/${id}`} className="mt-4 inline-block text-sm font-semibold text-[var(--color-brand-600)]">
          {t.backToOrder}
        </Link>
      </main>
    );
  }

  const locale = user.preferredLocale;
  const money = (value: bigint) => formatMoney(value, receipt.currency, locale);
  const rows: [string, string][] = [
    [t.reference, receipt.reference],
    [t.service, receipt.serviceTitle],
    [t.provider, receipt.providerName],
    ...(receipt.dueAt ? ([[t.deliveryBy, formatReceiptDate(receipt.dueAt, locale)]] as [string, string][]) : []),
  ];
  const payment: [string, string][] = [
    [t.paidOn, formatReceiptDate(receipt.paidAt, locale)],
    [t.method, t.methodValue],
    ...(receipt.paymentRef ? ([[t.paymentRef, receipt.paymentRef]] as [string, string][]) : []),
    [t.status, t.statusValue],
  ];

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 print:max-w-none print:py-0">
      <article className="overflow-hidden rounded-3xl border border-[var(--border)] bg-white print:rounded-none print:border-0">
        <div className="h-1.5 bg-gradient-to-r from-[#108043] to-[#2fa36a]" />
        <div className="p-6 sm:p-10">
          <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-display text-lg font-bold text-[var(--color-brand-600)]">Toomny</p>
              <p className="text-xs text-[var(--subtle)]">{t.issuer}</p>
            </div>
            <div className="sm:text-right">
              <h1 className="font-display text-2xl font-bold">{t.receiptPageTitle}</h1>
              <p className="mt-1 text-sm text-[var(--subtle)]">{receipt.reference}</p>
            </div>
          </header>

          <p className="mt-6 text-sm text-[var(--subtle)]">{t.receiptPageLead}</p>

          <section className="mt-8">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-[var(--subtle)]">{t.summaryTitle}</h2>
            <dl className="mt-3 divide-y divide-[var(--border)]">
              {rows.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-6 py-3 text-sm">
                  <dt className="text-[var(--subtle)]">{label}</dt>
                  <dd className="text-right font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="mt-8 rounded-2xl bg-[var(--color-brand-50)] p-5">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-[var(--subtle)]">{t.receiptTitle}</h2>
            <dl className="mt-3 divide-y divide-[var(--border)]">
              <div className="flex justify-between gap-6 py-3 text-sm">
                <dt className="text-[var(--subtle)]">{t.price}</dt>
                <dd className="font-medium">{money(receipt.priceMinor)}</dd>
              </div>
              <div className="flex justify-between gap-6 py-3 text-sm">
                <dt className="text-[var(--subtle)]">{t.fee}</dt>
                <dd className="font-medium">{money(receipt.feeMinor)}</dd>
              </div>
              <div className="flex justify-between gap-6 py-4">
                <dt className="font-display text-base font-bold">{t.total}</dt>
                <dd className="font-display text-xl font-bold text-[var(--color-brand-600)]">{money(receipt.totalMinor)}</dd>
              </div>
            </dl>
          </section>

          <section className="mt-8">
            <dl className="divide-y divide-[var(--border)]">
              {payment.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-6 py-3 text-sm">
                  <dt className="text-[var(--subtle)]">{label}</dt>
                  <dd className="break-all text-right font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="mt-8 rounded-2xl border-l-4 border-[var(--color-gold-500,#d9a441)] bg-[#fbfaf3] p-5">
            <p className="font-display text-sm font-bold">{t.escrowTitle}</p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--subtle)]">{t.escrowBody}</p>
          </section>

          <footer className="mt-10 flex flex-col gap-3 print:hidden sm:flex-row">
            <Link
              href={`/orders/${id}`}
              className="rounded-full bg-[var(--color-brand-500)] px-5 py-2.5 text-center text-sm font-semibold text-white hover:bg-[var(--color-brand-600)]"
            >
              {t.backToOrder}
            </Link>
            <PrintButton label={t.print} />
          </footer>
        </div>
      </article>
    </main>
  );
}

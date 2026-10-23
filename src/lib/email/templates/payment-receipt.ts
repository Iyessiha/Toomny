import type { Locale } from "@/i18n/dictionaries";
import { getReceiptTexts } from "@/i18n/receipt";
import { formatMoney } from "@/lib/money";
import { escapeHtml, formatReceiptDate } from "@/lib/receipt-format";
import type { Receipt } from "@/lib/receipt";
import { emailLayout } from "./layout";

export type PaymentReceiptEmailOpts = {
  audience: "client" | "provider";
  firstName: string;
  receipt: Receipt;
  orderUrl: string;
  receiptUrl: string;
  locale: Locale;
  siteUrl: string;
};

const LABEL = "padding:10px 0;font-size:13px;color:#6b7b72;border-bottom:1px solid #e6ece8;";
const VALUE = "padding:10px 0;font-size:14px;color:#1d2b23;text-align:right;border-bottom:1px solid #e6ece8;";

function row(label: string, value: string): string {
  return `<tr><td style="${LABEL}">${label}</td><td style="${VALUE}">${value}</td></tr>`;
}

function button(href: string, label: string, primary: boolean): string {
  const background = primary ? "#108043" : "#ffffff";
  const color = primary ? "#ffffff" : "#108043";
  return `<a href="${href}" style="display:inline-block;margin:0 8px 8px 0;padding:13px 24px;font-size:14px;font-weight:600;color:${color};background:${background};border:1px solid #108043;border-radius:12px;text-decoration:none;">${label}</a>`;
}

/**
 * E-mail « paiement confirmé » : reçu détaillé pour le client, commande payée
 * avec bouton « Démarrer » pour le prestataire.
 */
export function renderPaymentReceiptEmail(opts: PaymentReceiptEmailOpts): string {
  const t = getReceiptTexts(opts.locale);
  const r = opts.receipt;
  const isClient = opts.audience === "client";
  const money = (value: bigint) => formatMoney(value, r.currency, opts.locale);
  const greeting = t.greeting(escapeHtml(opts.firstName));
  const title = isClient ? t.title : t.providerTitle;
  const intro = isClient ? t.intro : t.providerIntro;

  const recap = [
    row(t.reference, escapeHtml(r.reference)),
    row(t.service, escapeHtml(r.serviceTitle)),
    row(isClient ? t.provider : t.payer, escapeHtml(isClient ? r.providerName : r.clientName)),
    ...(r.dueAt ? [row(t.deliveryBy, formatReceiptDate(r.dueAt, opts.locale))] : []),
  ].join("");

  const receiptBox = `
        <div style="margin:0 0 28px;padding:20px 22px;background:#f4f9f6;border:1px solid #d7ebdf;border-radius:16px;">
          <h2 style="margin:0 0 4px;font-size:15px;font-weight:700;color:#1d2b23;">${t.receiptTitle}</h2>
          <p style="margin:0 0 8px;font-size:12px;color:#6b7b72;">${t.issuer}</p>
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            ${row(t.price, money(r.priceMinor))}
            ${row(t.fee, money(r.feeMinor))}
            <tr>
              <td style="padding:14px 0 6px;font-size:15px;font-weight:700;color:#1d2b23;">${t.total}</td>
              <td style="padding:14px 0 6px;font-size:18px;font-weight:700;color:#108043;text-align:right;">${money(r.totalMinor)}</td>
            </tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:14px;">
            ${row(t.paidOn, formatReceiptDate(r.paidAt, opts.locale))}
            ${row(t.method, t.methodValue)}
            ${r.paymentRef ? row(t.paymentRef, escapeHtml(r.paymentRef)) : ""}
            ${row(t.status, t.statusValue)}
          </table>
        </div>`;

  const content = `
    <tr>
      <td style="height:4px;background:linear-gradient(90deg,#108043,#2fa36a);border-radius:20px 20px 0 0;"></td>
    </tr>
    <tr>
      <td style="padding:36px 36px 32px;">
        <p style="margin:0 0 8px;font-size:13px;color:#6b7b72;">${greeting}</p>
        <h1 style="margin:0 0 14px;font-size:22px;font-weight:700;color:#108043;line-height:1.3;">✓ ${title}</h1>
        <p style="margin:0 0 28px;font-size:15px;color:#4f5f56;line-height:1.6;">${intro}</p>

        <h2 style="margin:0 0 6px;font-size:15px;font-weight:700;color:#1d2b23;">${t.summaryTitle}</h2>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px;">${recap}</table>

        ${isClient ? receiptBox : ""}

        <div style="margin:0 0 28px;padding:16px 18px;background:#fbfaf3;border-left:3px solid #d9a441;border-radius:8px;">
          <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#1d2b23;">${t.escrowTitle}</p>
          <p style="margin:0;font-size:13px;color:#4f5f56;line-height:1.6;">${isClient ? t.escrowBody : t.providerEscrow}</p>
        </div>

        <div>
          ${isClient
            ? `${button(opts.orderUrl, t.viewOrder, true)} ${button(opts.receiptUrl, t.viewReceipt, false)}`
            : button(opts.orderUrl, t.startOrder, true)}
        </div>
      </td>
    </tr>
  `;

  return emailLayout({
    siteUrl: opts.siteUrl,
    previewText: t.preheader,
    children: `<table width="100%" cellpadding="0" cellspacing="0" role="presentation">${content}</table>`,
  });
}

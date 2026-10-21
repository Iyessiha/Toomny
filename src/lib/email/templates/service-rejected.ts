import type { Locale } from "@/i18n/dictionaries";
import { getListingGuideTexts, isRejectionReason, type RejectionReason } from "@/i18n/listing-guide";
import { emailLayout } from "./layout";

export type ServiceRejectedEmailOpts = {
  firstName: string;
  serviceTitle: string;
  reasons: string[];
  message: string;
  ctaUrl: string;
  locale: Locale;
  siteUrl: string;
};

// Tout texte saisi par l'admin ou le prestataire passe par ici avant d'entrer dans le HTML.
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderServiceRejectedEmail(opts: ServiceRejectedEmailOpts): string {
  const t = getListingGuideTexts(opts.locale).email;
  const reasonTexts = getListingGuideTexts(opts.locale).reasons;
  const validReasons = opts.reasons.filter(isRejectionReason) as RejectionReason[];
  const service = escapeHtml(opts.serviceTitle);
  const ctaLabel = t.cta;

  const reasonsHtml = validReasons.length
    ? `<h2 style="margin:24px 0 8px;font-size:16px;color:#e8eaf0;">${escapeHtml(t.reasonsTitle)}</h2>
       <ul style="margin:0 0 16px;padding-left:20px;font-size:14px;color:#9aa0b8;line-height:1.7;">
         ${validReasons.map((r) => `<li>${escapeHtml(reasonTexts[r])}</li>`).join("")}
       </ul>`
    : "";

  const messageHtml = opts.message.trim()
    ? `<h2 style="margin:24px 0 8px;font-size:16px;color:#e8eaf0;">${escapeHtml(t.messageTitle)}</h2>
       <p style="margin:0 0 16px;padding:12px 16px;border-left:3px solid #5b6af5;font-size:14px;color:#c8cce0;line-height:1.6;white-space:pre-line;">${escapeHtml(opts.message.trim())}</p>`
    : "";

  const guideHtml = t.guide
    .map(
      (section) => `
        <h3 style="margin:20px 0 6px;font-size:15px;color:#e8eaf0;">${escapeHtml(section.title)}</h3>
        <ul style="margin:0;padding-left:20px;font-size:14px;color:#9aa0b8;line-height:1.7;">
          ${section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>`,
    )
    .join("");

  const content = `
    <tr>
      <td style="height:4px;background:linear-gradient(90deg,#5b6af5,#8b97ff);border-radius:20px 20px 0 0;"></td>
    </tr>
    <tr>
      <td style="padding:36px 36px 32px;">
        <p style="margin:0 0 8px;font-size:13px;color:#7b82a0;">${escapeHtml(opts.firstName ? t.greeting(opts.firstName) : opts.locale === "en" ? "Hello," : "Bonjour,")}</p>
        <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#e8eaf0;line-height:1.3;">${escapeHtml(t.subject(opts.serviceTitle))}</h1>
        <p style="margin:0 0 8px;font-size:15px;color:#9aa0b8;line-height:1.6;">${escapeHtml(t.intro(opts.serviceTitle))}</p>
        ${reasonsHtml}
        ${messageHtml}

        <h2 style="margin:28px 0 4px;font-size:17px;color:#e8eaf0;">${escapeHtml(t.guideTitle)}</h2>
        ${guideHtml}

        <table cellpadding="0" cellspacing="0" role="presentation" style="margin-top:28px;">
          <tr>
            <td style="border-radius:12px;background:#5b6af5;">
              <a href="${escapeHtml(opts.ctaUrl)}" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">${escapeHtml(ctaLabel)}</a>
            </td>
          </tr>
        </table>

        <p style="margin:28px 0 4px;font-size:14px;color:#9aa0b8;line-height:1.6;">${escapeHtml(t.closing)}</p>
        <p style="margin:0;font-size:14px;color:#e8eaf0;">${escapeHtml(t.signature)}</p>
        <p style="margin:0;font-size:13px;color:#7b82a0;">${service}</p>
      </td>
    </tr>
  `;

  return emailLayout({
    siteUrl: opts.siteUrl,
    previewText: t.intro(opts.serviceTitle),
    children: `<table width="100%" cellpadding="0" cellspacing="0" role="presentation">${content}</table>`,
  });
}

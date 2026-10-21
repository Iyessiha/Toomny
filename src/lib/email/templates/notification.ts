import type { Locale } from "@/i18n/dictionaries";
import { emailLayout } from "./layout";

export type NotificationEmailOpts = {
  firstName: string;
  title: string;
  body: string;
  ctaUrl: string;
  locale: Locale;
  siteUrl: string;
};

export function renderNotificationEmail(opts: NotificationEmailOpts): string {
  const greeting = opts.locale === "en" ? `Hello ${opts.firstName},` : `Bonjour ${opts.firstName},`;
  const ctaLabel = opts.locale === "en" ? "View details" : "Voir le détail";

  const content = `
    <!-- GRADIENT BAR -->
    <tr>
      <td style="height:4px;background:linear-gradient(90deg,#108043,#2fa36a);border-radius:20px 20px 0 0;"></td>
    </tr>
    <tr>
      <td style="padding:36px 36px 32px;">

        <!-- GREETING -->
        <p style="margin:0 0 8px;font-size:13px;color:#6b7b72;">${greeting}</p>

        <!-- TITLE -->
        <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1d2b23;line-height:1.3;">${opts.title}</h1>

        <!-- BODY -->
        <p style="margin:0 0 28px;font-size:15px;color:#4f5f56;line-height:1.6;">${opts.body}</p>

        <!-- CTA BUTTON -->
        <table cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="border-radius:12px;background:#108043;">
              <a href="${opts.ctaUrl}" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.01em;">${ctaLabel}</a>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  `;

  return emailLayout({
    siteUrl: opts.siteUrl,
    previewText: opts.body,
    children: `<table width="100%" cellpadding="0" cellspacing="0" role="presentation">${content}</table>`,
  });
}

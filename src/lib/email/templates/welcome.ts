import type { Locale } from "@/i18n/dictionaries";
import { emailLayout } from "./layout";
import { guideTips, renderTipsHtml } from "./guides";

export type WelcomeEmailOpts = {
  to: string;
  firstName: string;
  locale: Locale;
  siteUrl: string;
};

const copy = {
  fr: {
    preview: "Votre compte est prêt : voici les étapes pour publier votre première prestation.",
    headline: "Bienvenue sur Toomny",
    subline: "La marketplace africaine du talent numérique.",
    body: "Votre compte est créé. Pour être visible et recevoir vos premières commandes, suivez ces étapes dans l'ordre.",
    cta: "Compléter mon profil",
    footer: "Des questions ? Répondez à cet email, notre équipe est là.",
  },
  en: {
    preview: "Your account is ready: here are the steps to publish your first service.",
    headline: "Welcome to Toomny",
    subline: "Africa's digital talent marketplace.",
    body: "Your account is created. To be visible and receive your first orders, follow these steps in order.",
    cta: "Complete my profile",
    footer: "Any questions? Reply to this email, our team is here.",
  },
} as const;

export function renderWelcomeEmail(opts: WelcomeEmailOpts): string {
  const t = copy[opts.locale];
  const tips = guideTips(opts.locale);
  const dashboardUrl = `${opts.siteUrl}/dashboard/profil`;

  const content = `
    <!-- HERO GRADIENT -->
    <tr>
      <td style="background:linear-gradient(135deg,#108043 0%,#0a552d 100%);padding:40px 36px 32px;border-radius:20px 20px 0 0;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#cdeeda;">Toomny</p>
        <h1 style="margin:0 0 10px;font-size:28px;font-weight:800;color:#ffffff;line-height:1.2;">${t.headline},<br/>${opts.firstName} 👋</h1>
        <p style="margin:0;font-size:14px;color:#e2f4ea;">${t.subline}</p>
      </td>
    </tr>

    <!-- BODY -->
    <tr>
      <td style="padding:32px 36px;">
        <p style="margin:0 0 8px;font-size:15px;color:#4f5f56;line-height:1.65;">${t.body}</p>

        ${renderTipsHtml([tips.setup, tips.profilePhoto, tips.coverPhoto])}

        <!-- CTA -->
        <table cellpadding="0" cellspacing="0" role="presentation" style="margin-top:28px;">
          <tr>
            <td style="border-radius:14px;background:linear-gradient(135deg,#108043,#2fa36a);">
              <a href="${dashboardUrl}" style="display:inline-block;padding:16px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.01em;">${t.cta} →</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- FOOTER NOTE -->
    <tr>
      <td style="padding:0 36px 32px;">
        <p style="margin:0;font-size:13px;color:#7d8a82;line-height:1.5;">${t.footer}</p>
      </td>
    </tr>
  `;

  return emailLayout({
    siteUrl: opts.siteUrl,
    previewText: t.preview,
    children: `<table width="100%" cellpadding="0" cellspacing="0" role="presentation">${content}</table>`,
  });
}

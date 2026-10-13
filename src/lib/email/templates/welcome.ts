import type { Locale } from "@/i18n/dictionaries";
import { emailLayout } from "./layout";

export type WelcomeEmailOpts = {
  to: string;
  firstName: string;
  locale: Locale;
  siteUrl: string;
};

const copy = {
  fr: {
    preview: "Votre compte est prêt — bienvenue dans la communauté.",
    headline: "Bienvenue sur Toomny",
    subline: "La marketplace africaine du talent numérique.",
    body: "Votre compte est créé et prêt à l'emploi. Complétez votre profil pour apparaître dans les résultats de recherche et recevoir vos premières missions.",
    steps: [
      { icon: "👤", label: "Complétez votre profil", detail: "Photo, bio, compétences." },
      { icon: "🛠️", label: "Publiez votre première prestation", detail: "Décrivez ce que vous faites." },
      { icon: "💼", label: "Recevez vos premières commandes", detail: "Les clients vous trouveront." },
    ],
    cta: "Accéder au dashboard",
    footer: "Des questions ? Répondez à cet email, notre équipe est là.",
  },
  en: {
    preview: "Your account is ready — welcome to the community.",
    headline: "Welcome to Toomny",
    subline: "Africa's digital talent marketplace.",
    body: "Your account is set up and ready to go. Complete your profile to appear in search results and receive your first orders.",
    steps: [
      { icon: "👤", label: "Complete your profile", detail: "Photo, bio, skills." },
      { icon: "🛠️", label: "Publish your first service", detail: "Describe what you do." },
      { icon: "💼", label: "Receive your first orders", detail: "Clients will find you." },
    ],
    cta: "Go to dashboard",
    footer: "Any questions? Reply to this email — our team is here.",
  },
} as const;

export function renderWelcomeEmail(opts: WelcomeEmailOpts): string {
  const t = copy[opts.locale];
  const dashboardUrl = `${opts.siteUrl}/dashboard`;

  const stepsHtml = t.steps
    .map(
      (s) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
        <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
          <tr>
            <td style="width:36px;vertical-align:top;padding-top:2px;font-size:18px;">${s.icon}</td>
            <td>
              <p style="margin:0;font-size:14px;font-weight:600;color:#e8eaf0;">${s.label}</p>
              <p style="margin:2px 0 0;font-size:13px;color:#7b82a0;">${s.detail}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`,
    )
    .join("");

  const content = `
    <!-- HERO GRADIENT -->
    <tr>
      <td style="background:linear-gradient(135deg,#1a1f35 0%,#0e1220 100%);padding:40px 36px 32px;border-radius:20px 20px 0 0;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#5b6af5;">Toomny</p>
        <h1 style="margin:0 0 10px;font-size:28px;font-weight:800;color:#ffffff;line-height:1.2;">${t.headline},<br/>${opts.firstName} 👋</h1>
        <p style="margin:0;font-size:14px;color:#7b82a0;">${t.subline}</p>
      </td>
    </tr>

    <!-- BODY -->
    <tr>
      <td style="padding:32px 36px;">
        <p style="margin:0 0 28px;font-size:15px;color:#9aa0b8;line-height:1.65;">${t.body}</p>

        <!-- STEPS -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:32px;">
          ${stepsHtml}
        </table>

        <!-- CTA -->
        <table cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="border-radius:14px;background:linear-gradient(135deg,#5b6af5,#7b8aff);">
              <a href="${dashboardUrl}" style="display:inline-block;padding:16px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.01em;">${t.cta} →</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- FOOTER NOTE -->
    <tr>
      <td style="padding:0 36px 32px;">
        <p style="margin:0;font-size:13px;color:#4b5270;line-height:1.5;">${t.footer}</p>
      </td>
    </tr>
  `;

  return emailLayout({
    siteUrl: opts.siteUrl,
    previewText: t.preview,
    children: `<table width="100%" cellpadding="0" cellspacing="0" role="presentation">${content}</table>`,
  });
}

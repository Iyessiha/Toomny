import { emailLayout } from "./layout";

/**
 * Template HTML de l'email de confirmation d'adresse Supabase.
 * À copier dans : Supabase Dashboard → Auth → Email Templates → Confirm signup.
 *
 * Variables Supabase disponibles : {{ .ConfirmationURL }}
 * Pour prévisualiser sans Supabase, appeler renderConfirmEmail({ confirmUrl: '#' }).
 */

export type ConfirmEmailOpts = {
  confirmUrl: string;
  siteUrl?: string;
};

const copy = {
  fr: {
    preview: "Confirmez votre adresse pour accéder à Toomny.",
    headline: "Confirmez votre adresse",
    body: "Cliquez sur le bouton ci-dessous pour activer votre compte. Ce lien est valable 24 heures.",
    cta: "Confirmer mon adresse",
    warning: "Si vous n'avez pas créé de compte sur Toomny, ignorez cet email.",
    footer: "Des questions ? Répondez à cet email, notre équipe est là.",
  },
};

export function renderConfirmEmail(opts: ConfirmEmailOpts): string {
  const t = copy.fr;
  const siteUrl = opts.siteUrl ?? "https://toomny.com";

  const content = `
    <!-- HERO -->
    <tr>
      <td style="background:linear-gradient(135deg,#1a1f35 0%,#0e1220 100%);padding:40px 36px 32px;border-radius:20px 20px 0 0;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#5b6af5;">Toomny</p>
        <h1 style="margin:0 0 10px;font-size:26px;font-weight:800;color:#ffffff;line-height:1.2;">${t.headline}</h1>
      </td>
    </tr>

    <!-- BODY -->
    <tr>
      <td style="padding:32px 36px;">
        <p style="margin:0 0 32px;font-size:15px;color:#9aa0b8;line-height:1.65;">${t.body}</p>

        <!-- CTA -->
        <table cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="border-radius:14px;background:linear-gradient(135deg,#5b6af5,#7b8aff);">
              <a href="${opts.confirmUrl}" style="display:inline-block;padding:16px 36px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.01em;">${t.cta} →</a>
            </td>
          </tr>
        </table>

        <!-- Fallback URL -->
        <p style="margin:28px 0 0;font-size:12px;color:#4b5270;line-height:1.5;">
          Ou copiez ce lien dans votre navigateur :<br/>
          <span style="color:#5b6af5;word-break:break-all;">${opts.confirmUrl}</span>
        </p>
      </td>
    </tr>

    <!-- WARNING -->
    <tr>
      <td style="padding:0 36px 24px;">
        <p style="margin:0;padding:12px 16px;background:rgba(255,255,255,0.04);border-radius:10px;font-size:12px;color:#4b5270;line-height:1.5;">
          ${t.warning}
        </p>
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
    siteUrl,
    previewText: t.preview,
    children: `<table width="100%" cellpadding="0" cellspacing="0" role="presentation">${content}</table>`,
  });
}

/**
 * Template HTML brut pour Supabase (avec variable {{ .ConfirmationURL }}).
 * À copier-coller directement dans le champ HTML du dashboard Supabase.
 */
export function supabaseConfirmTemplate(siteUrl = "https://toomny.com"): string {
  return renderConfirmEmail({ confirmUrl: "{{ .ConfirmationURL }}", siteUrl });
}

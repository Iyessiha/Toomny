import { socialLinks } from "@/lib/social";

export type LayoutOpts = {
  siteUrl: string;
  previewText?: string;
  children: string;
};

export function emailLayout({ siteUrl, previewText, children }: LayoutOpts): string {
  const social = socialLinks();
  const socialHtml = social.length
    ? `<p style="margin:0 0 14px;font-size:13px;">
        ${social
          .map((s) => `<a href="${s.url}" style="color:#108043;text-decoration:none;font-weight:600;margin:0 8px;">${s.label}</a>`)
          .join("")}
      </p>`
    : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<title>Toomny</title>
${previewText ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${previewText}</div>` : ""}
</head>
<body style="margin:0;padding:0;background:#f3f6f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f3f6f4;padding:40px 16px;">
  <tr>
    <td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;">

        <!-- HEADER : logo Toomny -->
        <tr>
          <td style="padding-bottom:28px;text-align:center;">
            <a href="${siteUrl}" style="text-decoration:none;display:inline-block;">
              <img src="${siteUrl}/icon.png" width="40" height="40" alt="Toomny" style="display:inline-block;vertical-align:middle;border:0;width:40px;height:40px;border-radius:10px;" />
              <span style="display:inline-block;vertical-align:middle;margin-left:10px;font-size:24px;font-weight:800;letter-spacing:-0.5px;color:#108043;">Toomny</span>
            </a>
          </td>
        </tr>

        <!-- CONTENT CARD -->
        <tr>
          <td style="background:#ffffff;border-radius:20px;border:1px solid #dfe7e2;overflow:hidden;">
            ${children}
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="padding-top:30px;text-align:center;">
            ${socialHtml}
            <p style="margin:0 0 10px;font-size:12px;color:#7d8a82;">
              <a href="${siteUrl}" style="color:#108043;text-decoration:none;font-weight:600;">Toomny</a>
              &nbsp;·&nbsp;
              <a href="${siteUrl}/cgu" style="color:#7d8a82;text-decoration:none;">CGU</a>
              &nbsp;·&nbsp;
              <a href="${siteUrl}/confidentialite" style="color:#7d8a82;text-decoration:none;">Confidentialité</a>
              &nbsp;·&nbsp;
              <a href="${siteUrl}/mentions-legales" style="color:#7d8a82;text-decoration:none;">Mentions légales</a>
            </p>
            <p style="margin:0;font-size:11px;color:#8a968f;">
              Vous recevez cet e-mail car vous avez un compte Toomny.
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

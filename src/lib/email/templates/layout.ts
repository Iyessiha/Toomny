export type LayoutOpts = {
  siteUrl: string;
  previewText?: string;
  children: string;
};

export function emailLayout({ siteUrl, previewText, children }: LayoutOpts): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<title>Toomny</title>
${previewText ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${previewText}</div>` : ""}
</head>
<body style="margin:0;padding:0;background:#0c0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#0c0f14;padding:40px 16px;">
  <tr>
    <td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;">

        <!-- HEADER -->
        <tr>
          <td style="padding-bottom:32px;text-align:center;">
            <a href="${siteUrl}" style="text-decoration:none;">
              <span style="font-size:22px;font-weight:800;letter-spacing:-0.5px;color:#ffffff;">Toomny</span>
              <span style="font-size:22px;font-weight:800;color:#5b6af5;">.</span>
            </a>
          </td>
        </tr>

        <!-- CONTENT CARD -->
        <tr>
          <td style="background:#131720;border-radius:20px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
            ${children}
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="padding-top:32px;text-align:center;">
            <p style="margin:0 0 8px;font-size:12px;color:#4b5270;">
              <a href="${siteUrl}" style="color:#5b6af5;text-decoration:none;">Toomny</a>
              &nbsp;·&nbsp;
              <a href="${siteUrl}/privacy" style="color:#4b5270;text-decoration:none;">Confidentialité</a>
              &nbsp;·&nbsp;
              <a href="${siteUrl}/terms" style="color:#4b5270;text-decoration:none;">CGU</a>
            </p>
            <p style="margin:0;font-size:11px;color:#353b52;">
              Vous recevez cet email car vous avez un compte Toomny.
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

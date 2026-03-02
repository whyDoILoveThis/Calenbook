/**
 * Wraps email body content in a premium, glassmorphism-inspired HTML email template.
 * Works across all major email clients (Gmail, Outlook, Apple Mail, etc.).
 */

export function wrapEmailTemplate(bodyHtml: string, subject?: string): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <meta name="x-apple-disable-message-reformatting"/>
  <title>${subject || "Calenbook"}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }

    /* Dark mode overrides */
    @media (prefers-color-scheme: dark) {
      .email-bg { background-color: #0a0a0f !important; }
      .card-bg { background-color: #12121a !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0a0f;" class="email-bg">
    <tr>
      <td align="center" style="padding: 40px 16px 20px;">

        <!-- Logo / Brand -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="
                    font-size: 28px;
                    font-weight: 300;
                    letter-spacing: 6px;
                    color: #ffffff;
                    text-transform: uppercase;
                    padding: 0 0 6px;
                  ">
                    CALENBOOK
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <div style="width: 40px; height: 1px; background: linear-gradient(90deg, transparent, #a78bfa, transparent);"></div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Main Card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
          <tr>
            <td style="
              background-color: #12121a;
              border: 1px solid rgba(167, 139, 250, 0.15);
              border-top: 3px solid #a78bfa;
              border-radius: 20px;
              padding: 0;
              box-shadow: 0 25px 60px rgba(0,0,0,0.5), 0 0 80px rgba(167, 139, 250, 0.06);
            " class="card-bg">

              <!-- Card content -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding: 44px 40px 40px;">

                    <!-- Body content -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="
                          font-size: 15px;
                          line-height: 1.7;
                          color: rgba(255,255,255,0.75);
                        ">
                          ${bodyHtml}
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding: 0 40px;">
                    <div style="height: 1px; background: rgba(167, 139, 250, 0.1);"></div>
                  </td>
                </tr>
              </table>

              <!-- Footer inside card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding: 24px 40px 32px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="
                          font-size: 12px;
                          color: rgba(255,255,255,0.25);
                          letter-spacing: 0.5px;
                        ">
                          This is an automated message from <span style="color: rgba(167, 139, 250, 0.6);">Calenbook</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>

        <!-- Bottom branding -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
          <tr>
            <td align="center" style="padding: 32px 0 16px;">
              <span style="
                font-size: 11px;
                letter-spacing: 3px;
                color: rgba(255,255,255,0.12);
                text-transform: uppercase;
              ">calenbook.net</span>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

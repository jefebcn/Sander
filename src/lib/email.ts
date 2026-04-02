import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM = process.env.EMAIL_FROM ?? "Sander <noreply@sander.app>"
const APP_URL = process.env.NEXTAUTH_URL ?? process.env.APP_URL ?? "http://localhost:3000"

export async function sendPasswordResetEmail(to: string, token: string) {
  const url = `${APP_URL}/auth/reset-password?token=${token}`

  if (!resend) {
    // Dev: log link to console instead of sending
    console.log(`[DEV] Password reset link for ${to}:\n${url}`)
    return
  }

  await resend.emails.send({
    from: FROM,
    to,
    subject: "Reimposta la tua password — Sander",
    html: `
<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#181818;border-radius:20px;padding:40px;border:1px solid #2a2a2a;">
        <tr><td align="center" style="padding-bottom:28px;">
          <img src="${APP_URL}/sander-logo.png" alt="Sander" height="64" style="object-fit:contain;" />
        </td></tr>
        <tr><td style="padding-bottom:12px;">
          <h1 style="margin:0;font-size:22px;font-weight:900;color:#ffffff;text-align:center;">
            Reimposta la tua password
          </h1>
        </td></tr>
        <tr><td style="padding-bottom:32px;">
          <p style="margin:0;font-size:15px;color:#888;text-align:center;line-height:1.6;">
            Hai richiesto di reimpostare la password del tuo account Sander.<br/>
            Il link è valido per <strong style="color:#ccc;">1 ora</strong>.
          </p>
        </td></tr>
        <tr><td align="center" style="padding-bottom:32px;">
          <a href="${url}"
             style="display:inline-block;background:#c9f31d;color:#000;font-weight:900;font-size:16px;padding:16px 40px;border-radius:14px;text-decoration:none;letter-spacing:0.02em;">
            Reimposta password
          </a>
        </td></tr>
        <tr><td>
          <p style="margin:0;font-size:12px;color:#555;text-align:center;line-height:1.6;">
            Se non hai richiesto questo, ignora questa email — la tua password rimarrà invariata.<br/>
            Link diretto: <a href="${url}" style="color:#c9f31d;word-break:break-all;">${url}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })
}

import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM = process.env.EMAIL_FROM ?? "Sander <noreply@sander.app>"
// Links in emails. NEXT_PUBLIC_APP_URL is the one the payment returns already
// use; the old APP_URL / NEXTAUTH_URL pointed at a retired Vercel project.
const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.NODE_ENV === "production" ? "https://www.sanderbv.it" : "http://localhost:3000")
).replace(/\/$/, "")

export async function sendPasswordResetEmail(to: string, token: string) {
  const url = `${APP_URL}/auth/reset-password?token=${token}`

  if (!resend) {
    // Dev: log link to console instead of sending
    console.log(`[DEV] Password reset link for ${to}:\n${url}`)
    return
  }

  // Resend reports failures in the result instead of throwing: surface them,
  // or a rejected sender looks like a sent email.
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "Reimposta la tua password — Sander",
    text: `Hai chiesto di reimpostare la password del tuo account SANDER.\n\nApri questo link (vale 1 ora):\n${url}\n\nSe non sei stato tu, ignora questa email: la password resta quella di prima.`,
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
             style="display:inline-block;background:#c6f736;color:#000;font-weight:900;font-size:16px;padding:16px 40px;border-radius:14px;text-decoration:none;letter-spacing:0.02em;">
            Reimposta password
          </a>
        </td></tr>
        <tr><td>
          <p style="margin:0;font-size:12px;color:#555;text-align:center;line-height:1.6;">
            Se non hai richiesto questo, ignora questa email — la tua password rimarrà invariata.<br/>
            Link diretto: <a href="${url}" style="color:#c6f736;word-break:break-all;">${url}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })
  if (error) {
    console.error("sendPasswordResetEmail failed", error)
    throw new Error(`Resend: ${error.message}`)
  }
}

/** "Password dimenticata?" for an account with no password (made with Google
 *  or Apple): tell that inbox how it actually signs in, instead of silence. */
export async function sendNoPasswordEmail(to: string, providers: string[]) {
  const how = providers.includes("google") && providers.includes("apple")
    ? "«Continua con Google» o «Continua con Apple»"
    : providers.includes("apple")
      ? "«Continua con Apple»"
      : "«Continua con Google»"
  const url = `${APP_URL}/auth/signin`
  if (!resend) {
    console.log(`[DEV] No-password notice for ${to}: ${how}`)
    return
  }
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "Come accedere a SANDER",
    text: `Hai chiesto di reimpostare la password, ma il tuo account SANDER non ne ha una: lo hai creato con ${how.replace(/[«»]/g, "")}.\n\nPer entrare apri ${url} e tocca ${how.replace(/[«»]/g, "")}.\n\nSe non sei stato tu, ignora questa email.`,
    html: `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;max-width:480px">
<p style="margin:0 0 12px">Hai chiesto di reimpostare la password, ma il tuo account SANDER <strong>non ha una password</strong>: lo hai creato con ${escapeHtml(how)}.</p>
<p style="margin:0 0 16px">Per entrare tocca ${escapeHtml(how)} nella pagina di accesso.</p>
<p style="margin:0 0 16px"><a href="${url}" style="display:inline-block;background:#c6f736;color:#000;font-weight:800;padding:12px 28px;border-radius:12px;text-decoration:none">Vai all'accesso</a></p>
<p style="margin:0;font-size:12px;color:#777">Se non sei stato tu, ignora questa email.</p>
</div>`,
  })
  if (error) {
    console.error("sendNoPasswordEmail failed", error)
    throw new Error(`Resend: ${error.message}`)
  }
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)

/** Short plain notice to the admins (ADMIN_EMAILS). Skipped without Resend.
 *  Resend reports failures in the result instead of throwing, so it is returned. */
export async function sendAdminEmail(
  subject: string,
  lines: string[],
  path = "/admin/metriche",
): Promise<{ ok: true; to: string[] } | { ok: false; reason: string }> {
  const to = (process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean)
  if (!resend) return { ok: false, reason: "RESEND_API_KEY non impostata su Vercel" }
  if (!to.length) return { ok: false, reason: "ADMIN_EMAILS non impostata su Vercel" }
  const url = `${APP_URL}${path}`
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject,
    html: `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6">${lines
      .map((l) => `<p style="margin:0 0 8px">${escapeHtml(l)}</p>`)
      .join("")}<p><a href="${url}">Apri il pannello</a></p></div>`,
  })
  if (error) {
    console.error("sendAdminEmail failed", error)
    return { ok: false, reason: `Resend: ${error.message} (mittente ${FROM})` }
  }
  return { ok: true, to }
}

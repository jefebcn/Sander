/**
 * Only same-site paths are accepted as a post-login destination, so
 * /auth/signin?callbackUrl=https://evil.example can't bounce people off-site.
 * "//host" and "/\host" are protocol-relative in browsers, so they are refused
 * too, as is anything with a backslash or control characters ("/\t/host").
 */
export function safeCallbackUrl(raw: unknown, fallback = "/"): string {
  if (typeof raw !== "string") return fallback
  const url = raw.trim()
  if (!url.startsWith("/")) return fallback
  if (url.startsWith("//") || url.startsWith("/\\")) return fallback
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f\\]/.test(url)) return fallback
  return url
}

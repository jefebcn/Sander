import type { Instrumentation } from "next"

/** Server errors (pages, route handlers, server actions) into the error log. */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return
  const { recordError } = await import("@/lib/errorLog")
  const e = err instanceof Error ? err : null
  await recordError({
    source: "server",
    message: e?.message ?? String(err),
    path: `${request.method} ${request.path} (${context.routeType})`,
    stack: e?.stack,
    digest: typeof err === "object" && err !== null && "digest" in err ? String(err.digest) : null,
  })
}

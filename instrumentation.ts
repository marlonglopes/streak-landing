// Next.js instrumentation entry. Called once per runtime (nodejs, edge) on
// cold start, before user code runs. Sentry uses this to load the runtime-
// specific config. Requires `experimental.instrumentationHook: true` in
// next.config.js on Next < 15.

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

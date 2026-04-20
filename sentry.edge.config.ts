// Edge runtime Sentry init (middleware.ts, route handlers with `runtime =
// "edge"`). Loaded from instrumentation.ts when NEXT_RUNTIME === "edge".

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
});

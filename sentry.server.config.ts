// Node runtime Sentry init. Loaded from instrumentation.ts when
// NEXT_RUNTIME === "nodejs". When NEXT_PUBLIC_SENTRY_DSN is unset, Sentry.init
// no-ops cleanly.

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
});

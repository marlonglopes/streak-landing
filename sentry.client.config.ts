// Browser Sentry init. Auto-loaded by @sentry/nextjs on the client.
// When NEXT_PUBLIC_SENTRY_DSN is unset (dev / pre-account state), Sentry.init
// no-ops — it logs a "No DSN" warning in the console and swallows events. That
// lets the scaffolding ship before the user has a Sentry project.

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // 100% in dev, 20% in prod. Retune once we see volume.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
  // Session replay is free on the Developer tier up to 5k/mo. Conservative
  // defaults: replay only on errors, not on every session.
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0,
  integrations: [
    Sentry.replayIntegration({
      // PII is safer masked by default; we can relax per-element later.
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  // Surface errors from the Next.js hydration path but drop noisy
  // extension-injected errors that aren't ours.
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "Non-Error promise rejection captured",
  ],
});

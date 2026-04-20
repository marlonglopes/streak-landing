const createNextIntlPlugin = require("next-intl/plugin");
const { withSentryConfig } = require("@sentry/nextjs");

// No URL-based locale routing; locale comes from profile/cookie/Accept-Language.
// The plugin only needs to know where getRequestConfig lives.
const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Next 14 still requires this flag for instrumentation.ts. Drop it once
    // we upgrade to Next 15, which enables it by default.
    instrumentationHook: true,
  },
};

// Build-time source map upload. Skipped automatically when SENTRY_AUTH_TOKEN
// isn't set — the runtime init still works, just without symbolication.
const sentryBuildOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: false,
};

module.exports = withSentryConfig(withNextIntl(nextConfig), sentryBuildOptions);

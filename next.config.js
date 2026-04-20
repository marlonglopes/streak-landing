const createNextIntlPlugin = require("next-intl/plugin");

// No URL-based locale routing; locale comes from profile/cookie/Accept-Language.
// The plugin only needs to know where getRequestConfig lives.
const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = withNextIntl(nextConfig);

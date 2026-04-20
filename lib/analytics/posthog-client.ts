// Client-side PostHog init. Called once from PostHogProvider on mount.
// No-op when NEXT_PUBLIC_POSTHOG_KEY is missing (pre-account state).

"use client";

import posthog from "posthog-js";

let initialized = false;

export function initPostHog(): void {
  if (typeof window === "undefined") return;
  if (initialized) return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.posthog.com",
    // We fire pageviews from a route-aware component so PostHog's default
    // pushState listener stays off.
    capture_pageview: false,
    // Session recordings are opt-in; free tier covers 5k/mo, worth saving
    // until we have features that need it.
    disable_session_recording: true,
    // Identified-only keeps the quota honest — anonymous browser noise
    // doesn't create a person row.
    person_profiles: "identified_only",
    // Standard-compliant GPC / DNT respect.
    respect_dnt: true,
  });

  initialized = true;
}

export { default as posthog } from "posthog-js";

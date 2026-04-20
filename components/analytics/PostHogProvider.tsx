"use client";

import { useEffect } from "react";
import { initPostHog } from "@/lib/analytics/posthog-client";

// Thin wrapper that initializes PostHog on the client once. Kept as a
// component (not a hook) so the root layout can include it without marking
// itself "use client".
export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog();
  }, []);
  return <>{children}</>;
}

"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { posthog } from "@/lib/analytics/posthog-client";

// Fires $pageview whenever the App-Router path or query changes. We disable
// PostHog's built-in pageview capture (see posthog-client.ts) because its
// pushState listener doesn't line up with Next's soft navigations.
export default function PageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
    if (!pathname) return;
    const qs = searchParams?.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}

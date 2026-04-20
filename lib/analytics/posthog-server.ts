// Server-side PostHog. Used from Server Actions and route handlers so we
// capture real events even when the browser drops them (adblocker, network
// flake). Events are flushed on process shutdown; short-lived Lambda/Vercel
// workers should call `shutdown()` or `flush()` before the function exits.
//
// No-op when NEXT_PUBLIC_POSTHOG_KEY is missing — callers can always invoke
// track() without env-checking. Keeps scaffolding safe before the account
// exists.

import { PostHog } from "posthog-node";
import type { ProductEvent } from "./events";

let client: PostHog | null = null;

function getClient(): PostHog | null {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return null;
  if (!client) {
    client = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.posthog.com",
      // Server-side sends are ~instant; keep the batcher tight so serverless
      // invocations don't need explicit flush() calls for single-event cases.
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return client;
}

/**
 * Fire a typed product event from the server.
 * `distinctId` must be the user's auth.users.id so client-side and server-side
 * events stitch to the same PostHog person.
 */
export function track(distinctId: string, event: ProductEvent): void {
  const c = getClient();
  if (!c) return;
  c.capture({
    distinctId,
    event: event.name,
    properties: event.props,
  });
}

/** Call this before a serverless function returns if you want guaranteed delivery. */
export async function flush(): Promise<void> {
  if (client) await client.shutdown();
}

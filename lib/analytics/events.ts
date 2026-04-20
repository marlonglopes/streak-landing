// Central registry of product events. Keeping them in one typed file means:
// (1) renaming an event is a single edit, not a grep-and-pray,
// (2) the PostHog dashboard maps cleanly to the types dev sees,
// (3) server and client fire the same keys.
//
// If you catch yourself calling posthog.capture("ad_hoc_name") from a
// component, add it here first.

export type ProductEventName =
  | "habit_created"
  | "habit_archived"
  | "check_in"
  | "streak_extended"
  | "reminder_sent"
  | "paywall_shown"
  | "checkout_started"
  | "subscription_activated";

export type ProductEvent =
  | { name: "habit_created"; props: { habit_id: string; cadence: "daily" | "weekly" } }
  | { name: "habit_archived"; props: { habit_id: string } }
  | { name: "check_in"; props: { habit_id: string; streak_length: number } }
  | { name: "streak_extended"; props: { habit_id: string; streak_length: number } }
  | { name: "reminder_sent"; props: { habit_id: string; channel: "email" | "whatsapp" } }
  | { name: "paywall_shown"; props: { trigger: "fourth_habit" | "freezes" | "stats_export" } }
  | { name: "checkout_started"; props: { price_id: string } }
  | { name: "subscription_activated"; props: { price_id: string } };

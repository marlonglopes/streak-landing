// Thin wrapper over Mandrill's /messages/send.json endpoint.
//
// Why not @mailchimp/mailchimp_transactional? It pulls in a lot of Node-only
// deps and breaks in the Vercel Edge runtime. A direct fetch is ~40 lines and
// keeps us portable. Swap in the SDK if we ever need batch send or webhooks.
//
// Dry-run contract: when MANDRILL_DRY_RUN=1 (default in dev) we log the payload
// and return a synthetic "dry-run" response instead of calling the API. Every
// cron tick in development hits this path — no quota usage, no real emails.

const MANDRILL_ENDPOINT = "https://mandrillapp.com/api/1.0/messages/send.json";

export type SendEmailInput = {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text: string;
  /** Propagated to Mandrill metadata so bounce/complaint webhooks can be attributed. */
  userId: string;
  habitId: string;
  /** Ignored by Mandrill but surfaced in the X-MC-Tags header; useful for dashboards. */
  tags?: string[];
};

export type SendEmailResult =
  | { status: "sent" | "queued" | "scheduled"; providerId: string }
  | { status: "rejected" | "invalid"; providerId: string | null; reason: string }
  | { status: "dry_run"; providerId: null };

type MandrillRecipientResponse = {
  email: string;
  status: "sent" | "queued" | "scheduled" | "rejected" | "invalid";
  reject_reason?: string | null;
  _id?: string;
};

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function isDryRun(): boolean {
  // Default to dry-run unless explicitly set to 0. Safer default for dev.
  const raw = process.env.MANDRILL_DRY_RUN;
  return raw === undefined || raw === "1" || raw === "true";
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (isDryRun()) {
    console.info("[mandrill:dry-run]", {
      to: input.to,
      subject: input.subject,
      userId: input.userId,
      habitId: input.habitId,
    });
    return { status: "dry_run", providerId: null };
  }

  const body = {
    key: env("MANDRILL_API_KEY"),
    message: {
      from_email: env("MANDRILL_FROM_EMAIL"),
      from_name: process.env.MANDRILL_FROM_NAME ?? "Streak",
      subject: input.subject,
      html: input.html,
      text: input.text,
      to: [{ email: input.to, name: input.toName, type: "to" }],
      tags: input.tags ?? ["reminder"],
      metadata: { user_id: input.userId, habit_id: input.habitId },
      track_opens: true,
      track_clicks: true,
      auto_text: false,
    },
  };

  const response = await fetch(MANDRILL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    return {
      status: "rejected",
      providerId: null,
      reason: `HTTP ${response.status}: ${text.slice(0, 200)}`,
    };
  }

  const payload = (await response.json()) as MandrillRecipientResponse[];
  const first = payload[0];
  if (!first) {
    return { status: "rejected", providerId: null, reason: "Empty Mandrill response" };
  }

  if (first.status === "rejected" || first.status === "invalid") {
    return {
      status: first.status,
      providerId: first._id ?? null,
      reason: first.reject_reason ?? "unknown",
    };
  }

  return { status: first.status, providerId: first._id ?? "" };
}

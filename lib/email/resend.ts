// Thin wrapper over Resend's /emails endpoint.
//
// Why a direct fetch instead of the `resend` npm package? The SDK is fine but
// drags in extra deps and adds a Node-vs-edge compat layer we don't need. Our
// send surface is one endpoint; ~40 lines of fetch keeps the bundle tight and
// the adapter identical in shape to the Mandrill one it replaces.
//
// Dry-run contract: when RESEND_DRY_RUN=1 (default in dev) we log the payload
// and return a synthetic "dry-run" response instead of calling the API. Every
// cron tick in development hits this path — no quota usage, no real emails.

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export type SendEmailInput = {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text: string;
  /** Propagated to Resend as a tag / header so bounce webhooks can be attributed. */
  userId: string;
  habitId: string;
  /** Surfaced as Resend tags; useful for filtering in their dashboard. */
  tags?: string[];
};

export type SendEmailResult =
  | { status: "sent"; providerId: string }
  | { status: "rejected" | "invalid"; providerId: string | null; reason: string }
  | { status: "dry_run"; providerId: null };

type ResendSuccess = { id: string };
type ResendError = {
  message?: string;
  name?: string;
  statusCode?: number;
};

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function isDryRun(): boolean {
  // Default to dry-run unless explicitly set to 0. Safer default for dev.
  const raw = process.env.RESEND_DRY_RUN;
  return raw === undefined || raw === "1" || raw === "true";
}

function formatFrom(email: string, name: string | undefined): string {
  return name ? `${name} <${email}>` : email;
}

function formatTo(email: string, name: string | undefined): string {
  return name ? `${name} <${email}>` : email;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (isDryRun()) {
    console.info("[resend:dry-run]", {
      to: input.to,
      subject: input.subject,
      userId: input.userId,
      habitId: input.habitId,
    });
    return { status: "dry_run", providerId: null };
  }

  const body = {
    from: formatFrom(env("RESEND_FROM_EMAIL"), process.env.RESEND_FROM_NAME ?? "Streak"),
    to: [formatTo(input.to, input.toName)],
    subject: input.subject,
    html: input.html,
    text: input.text,
    // Resend tags are key/value pairs; we fold user/habit ids in plus any freeform tags.
    tags: [
      { name: "user_id", value: input.userId },
      { name: "habit_id", value: input.habitId },
      ...(input.tags ?? ["reminder"]).map((t) => ({ name: "label", value: t })),
    ],
    headers: {
      "X-Entity-Ref-ID": input.habitId,
    },
  };

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => null)) as
    | ResendSuccess
    | ResendError
    | null;

  if (!response.ok) {
    const errorPayload = payload as ResendError | null;
    const reason = errorPayload?.message
      ? `${errorPayload.name ?? "error"}: ${errorPayload.message}`
      : `HTTP ${response.status}`;
    // 4xx on recipient-level problems → invalid; anything else → rejected.
    return {
      status: response.status >= 400 && response.status < 500 ? "invalid" : "rejected",
      providerId: null,
      reason: reason.slice(0, 500),
    };
  }

  const success = payload as ResendSuccess | null;
  if (!success?.id) {
    return { status: "rejected", providerId: null, reason: "Empty Resend response" };
  }

  return { status: "sent", providerId: success.id };
}

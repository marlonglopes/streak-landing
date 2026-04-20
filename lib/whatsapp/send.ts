// WhatsApp adapter — same shape as lib/email/mandrill.ts so the dispatcher can
// pick one at runtime from profiles.preferred_reminder_channel.
//
// State: scaffolding only. No BSP is wired yet — Meta Business verification +
// template approval is a user task (see docs/SPRINTS.md §Sprint 2.4). The
// adapter defaults to dry-run, and real sends throw until WHATSAPP_PROVIDER is
// explicitly configured. Swap the TODO in sendViaTwilio / sendViaZenvia for the
// real API call once the BSP is chosen.
//
// Why this file exists before the BSP: it lets us ship dispatch routing, types,
// and the settings UI behind the same interface the real sender will use. Zero
// surprise on the day the BSP credentials land.

export type SendWhatsAppInput = {
  /** E.164, e.g. "+5511998765432". */
  toPhone: string;
  toName?: string;
  /** Plaintext message body. Template name/variables are resolved upstream. */
  body: string;
  /** For pre-approved templates (required by Meta for business-initiated messages). */
  templateName?: string;
  templateLocale?: "en" | "pt-BR";
  templateVariables?: ReadonlyArray<string>;
  userId: string;
  habitId: string;
};

export type SendWhatsAppResult =
  | { status: "sent" | "queued"; providerId: string }
  | { status: "rejected" | "invalid"; providerId: string | null; reason: string }
  | { status: "dry_run"; providerId: null };

function isDryRun(): boolean {
  // Mirrors Mandrill: default to dry-run unless explicitly set to 0.
  const raw = process.env.WHATSAPP_DRY_RUN;
  return raw === undefined || raw === "1" || raw === "true";
}

export async function sendWhatsApp(input: SendWhatsAppInput): Promise<SendWhatsAppResult> {
  if (isDryRun()) {
    console.info("[whatsapp:dry-run]", {
      to: input.toPhone,
      template: input.templateName,
      locale: input.templateLocale,
      userId: input.userId,
      habitId: input.habitId,
    });
    return { status: "dry_run", providerId: null };
  }

  // Real send path intentionally unimplemented until a BSP is chosen.
  // Keeping the failure explicit and logged so a misconfigured prod env
  // doesn't silently drop reminders.
  const provider = process.env.WHATSAPP_PROVIDER;
  return {
    status: "rejected",
    providerId: null,
    reason: provider
      ? `WhatsApp provider '${provider}' not yet implemented`
      : "WHATSAPP_PROVIDER not set and WHATSAPP_DRY_RUN not enabled",
  };
}

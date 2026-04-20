"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ReminderPrefsInput = {
  channel: "email" | "none";
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
};

function parseHms(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  // Accept HH:MM or HH:MM:SS from the <input type="time">.
  const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(trimmed);
  if (!match) return null;
  return `${match[1]}:${match[2]}:${match[3] ?? "00"}`;
}

export async function updateReminderPrefs(formData: FormData) {
  const rawChannel = formData.get("channel");
  const input: ReminderPrefsInput = {
    channel: rawChannel === "none" ? "none" : "email",
    quietHoursStart: parseHms(formData.get("quietHoursStart")),
    quietHoursEnd: parseHms(formData.get("quietHoursEnd")),
  };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("profiles")
    .update({
      preferred_reminder_channel: input.channel,
      quiet_hours_start: input.quietHoursStart,
      quiet_hours_end: input.quietHoursEnd,
      // Clearing unsubscribed_at when they re-enable email is expected behavior.
      unsubscribed_at: input.channel === "email" ? null : undefined,
    })
    .eq("id", user.id);

  revalidatePath("/app/settings");
}

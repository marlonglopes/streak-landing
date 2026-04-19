"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { todayInTimezone } from "@/lib/dates";

const FREE_TIER_HABIT_LIMIT = 3;

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

function parseTargetDays(formData: FormData): number[] {
  // Checkbox group: each checked day submits its number 0–6.
  const days = formData
    .getAll("target_days_of_week")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
  // Deduplicate + sort for stable storage.
  return Array.from(new Set(days)).sort((a, b) => a - b);
}

function validateHabitForm(formData: FormData): {
  name: string;
  emoji: string | null;
  cadence: "daily" | "weekly";
  target_days_of_week: number[];
  reminder_time: string | null;
  error?: string;
} {
  const name = String(formData.get("name") ?? "").trim();
  const emojiRaw = String(formData.get("emoji") ?? "").trim();
  const cadenceRaw = String(formData.get("cadence") ?? "daily");
  const reminderRaw = String(formData.get("reminder_time") ?? "").trim();
  const target_days_of_week = parseTargetDays(formData);

  const cadence: "daily" | "weekly" =
    cadenceRaw === "weekly" ? "weekly" : "daily";
  const emoji = emojiRaw === "" ? null : emojiRaw.slice(0, 8);
  const reminder_time =
    reminderRaw === "" ? null : /^\d{2}:\d{2}$/.test(reminderRaw)
      ? `${reminderRaw}:00`
      : null;

  let error: string | undefined;
  if (name.length < 1 || name.length > 100) {
    error = "Name must be 1–100 characters.";
  } else if (target_days_of_week.length === 0) {
    error = "Pick at least one target day.";
  }

  return {
    name,
    emoji,
    cadence,
    target_days_of_week,
    reminder_time,
    error,
  };
}

export async function createHabit(formData: FormData) {
  const { supabase, user } = await requireUser();
  const parsed = validateHabitForm(formData);

  if (parsed.error) {
    redirect(`/app/habits/new?error=${encodeURIComponent(parsed.error)}`);
  }

  // Free-tier guard: count active habits only.
  const { count, error: countError } = await supabase
    .from("habits")
    .select("id", { count: "exact", head: true })
    .is("archived_at", null);
  if (countError) {
    redirect(
      `/app/habits/new?error=${encodeURIComponent(countError.message)}`,
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();

  const tier = profile?.subscription_tier ?? "free";
  if (tier === "free" && (count ?? 0) >= FREE_TIER_HABIT_LIMIT) {
    redirect(
      `/app/habits/new?error=${encodeURIComponent(
        `Free plan is limited to ${FREE_TIER_HABIT_LIMIT} active habits. Upgrade to Pro for unlimited.`,
      )}`,
    );
  }

  const { error } = await supabase.from("habits").insert({
    user_id: user.id,
    name: parsed.name,
    emoji: parsed.emoji,
    cadence: parsed.cadence,
    target_days_of_week: parsed.target_days_of_week,
    reminder_time: parsed.reminder_time,
  });

  if (error) {
    redirect(`/app/habits/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/app");
  redirect("/app");
}

export async function updateHabit(habitId: string, formData: FormData) {
  const { supabase } = await requireUser();
  const parsed = validateHabitForm(formData);

  if (parsed.error) {
    redirect(
      `/app/habits/${habitId}/edit?error=${encodeURIComponent(parsed.error)}`,
    );
  }

  const { error } = await supabase
    .from("habits")
    .update({
      name: parsed.name,
      emoji: parsed.emoji,
      cadence: parsed.cadence,
      target_days_of_week: parsed.target_days_of_week,
      reminder_time: parsed.reminder_time,
    })
    .eq("id", habitId);

  if (error) {
    redirect(
      `/app/habits/${habitId}/edit?error=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath("/app");
  redirect("/app");
}

export async function archiveHabit(formData: FormData) {
  const habitId = String(formData.get("habit_id") ?? "");
  if (!habitId) return;
  const { supabase } = await requireUser();

  await supabase
    .from("habits")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", habitId);

  revalidatePath("/app");
  redirect("/app");
}

export async function deleteHabit(formData: FormData) {
  const habitId = String(formData.get("habit_id") ?? "");
  if (!habitId) return;
  const { supabase } = await requireUser();

  // ON DELETE CASCADE on check_ins.habit_id handles the rest.
  await supabase.from("habits").delete().eq("id", habitId);

  revalidatePath("/app");
  redirect("/app");
}

/**
 * Toggle check-in for `today` in the user's timezone.
 * - If a row for (habit_id, local_date) exists → delete it (uncheck).
 * - Otherwise insert a new row.
 * The UNIQUE constraint on (habit_id, local_date) makes this idempotent
 * under double-click / double-submit.
 */
export async function toggleCheckIn(formData: FormData) {
  const habitId = String(formData.get("habit_id") ?? "");
  if (!habitId) return;
  const { supabase, user } = await requireUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .single();

  const tz = profile?.timezone ?? "UTC";
  const today = todayInTimezone(tz);

  const { data: existing } = await supabase
    .from("check_ins")
    .select("id")
    .eq("habit_id", habitId)
    .eq("local_date", today)
    .maybeSingle();

  if (existing) {
    await supabase.from("check_ins").delete().eq("id", existing.id);
  } else {
    await supabase.from("check_ins").insert({
      habit_id: habitId,
      user_id: user.id,
      local_date: today,
    });
  }

  revalidatePath("/app");
}

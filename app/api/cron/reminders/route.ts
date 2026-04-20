// Cron entrypoint. Loads every (habit × user) candidate, asks decideDispatch()
// whether to fire, then serializes sends through Resend.
//
// Idempotency: we INSERT a row into reminder_sends BEFORE calling the provider.
// The (habit_id, local_date, channel) UNIQUE constraint causes concurrent
// cron ticks to collide — only one wins, the other's decision becomes a no-op.
// After the provider responds, we UPDATE the row's status + provider_id.
//
// Auth: caller sends `Authorization: Bearer <CRON_SECRET>`. Everything else is
// rejected with 401 to prevent unauthenticated triggers. Triggered from GitHub
// Actions (see .github/workflows/reminders-cron.yml) because Vercel Hobby caps
// cron at once-per-day and we need 15-minute granularity.

import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { decideDispatch, type ReminderCandidate } from "@/lib/reminders/dispatch";
import { sendEmail } from "@/lib/email/resend";
import { buildReminderEmail } from "@/lib/email/templates";
import { createUnsubscribeToken } from "@/lib/email/unsubscribe-token";
import { isLocale } from "@/lib/i18n/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Summary = {
  considered: number;
  sent: number;
  skipped: Record<string, number>;
  failed: number;
};

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const unsubSecret = process.env.UNSUB_TOKEN_SECRET;
  if (!unsubSecret) {
    return NextResponse.json({ error: "UNSUB_TOKEN_SECRET missing" }, { status: 500 });
  }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const supabase = createServiceRoleClient();
  const summary: Summary = { considered: 0, sent: 0, skipped: {}, failed: 0 };

  // Load candidate users: subscribed + preferred channel is email + has email.
  // WhatsApp candidates are selected in Sprint 2.4 once a BSP is wired — the
  // schema already supports it (see lib/whatsapp/send.ts) but real sends are
  // gated on template approval from Meta.
  const { data: users, error: usersError } = await supabase
    .from("profiles")
    .select(
      "id, display_name, timezone, locale, preferred_reminder_channel, quiet_hours_start, quiet_hours_end, unsubscribed_at, phone_e164, whatsapp_opt_in",
    )
    .eq("preferred_reminder_channel", "email")
    .is("unsubscribed_at", null);
  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }
  if (!users || users.length === 0) {
    return NextResponse.json({ ok: true, summary });
  }

  // Grab emails from auth.users in bulk — service role can read auth schema.
  const userIds = users.map((u) => u.id);
  const emailMap = new Map<string, string>();
  const { data: authList } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  for (const u of authList?.users ?? []) {
    if (u.email && userIds.includes(u.id)) emailMap.set(u.id, u.email);
  }

  // Habits for those users.
  const { data: habits, error: habitsError } = await supabase
    .from("habits")
    .select("id, user_id, name, target_days_of_week, reminder_time")
    .in("user_id", userIds)
    .is("archived_at", null);
  if (habitsError) {
    return NextResponse.json({ error: habitsError.message }, { status: 500 });
  }

  const now = new Date();
  // Recent check-ins (last 3 days is plenty to decide "done today" across tzs).
  const lookbackStart = new Date(now);
  lookbackStart.setUTCDate(lookbackStart.getUTCDate() - 3);
  const lookbackStr = lookbackStart.toISOString().slice(0, 10);

  const { data: recentCheckIns } = await supabase
    .from("check_ins")
    .select("habit_id, local_date")
    .in("user_id", userIds)
    .gte("local_date", lookbackStr);

  const checkInsByHabit = new Map<string, Set<string>>();
  for (const row of recentCheckIns ?? []) {
    if (!checkInsByHabit.has(row.habit_id)) checkInsByHabit.set(row.habit_id, new Set());
    checkInsByHabit.get(row.habit_id)!.add(row.local_date);
  }

  const usersById = new Map(users.map((u) => [u.id, u]));

  for (const habit of habits ?? []) {
    summary.considered += 1;
    const profile = usersById.get(habit.user_id);
    if (!profile) continue;
    const email = emailMap.get(habit.user_id);
    if (!email) {
      bump(summary.skipped, "no_email");
      continue;
    }
    const locale = isLocale(profile.locale) ? profile.locale : "en";

    const candidate: ReminderCandidate = {
      userId: profile.id,
      habitId: habit.id,
      habitName: habit.name,
      targetDaysOfWeek: habit.target_days_of_week,
      reminderTime: habit.reminder_time,
      timezone: profile.timezone,
      locale,
      preferredChannel: profile.preferred_reminder_channel,
      quietHoursStart: profile.quiet_hours_start,
      quietHoursEnd: profile.quiet_hours_end,
      unsubscribedAt: profile.unsubscribed_at,
      phoneE164: profile.phone_e164,
      whatsappOptIn: profile.whatsapp_opt_in,
      checkInDates: checkInsByHabit.get(habit.id) ?? new Set(),
    };

    const decision = decideDispatch(candidate, now);
    if (!decision.send) {
      bump(summary.skipped, decision.reason);
      continue;
    }

    // Claim the slot — UNIQUE constraint keeps concurrent ticks honest.
    const { data: inserted, error: insertError } = await supabase
      .from("reminder_sends")
      .insert({
        user_id: profile.id,
        habit_id: habit.id,
        local_date: decision.localDate,
        channel: "email",
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError) {
      // Duplicate key means another tick already sent. Treat as skip.
      bump(summary.skipped, "already_sent");
      continue;
    }

    const unsubToken = createUnsubscribeToken(profile.id, unsubSecret);
    const email_ = buildReminderEmail({
      locale,
      displayName: profile.display_name,
      habitName: habit.name,
      streakDays: 0, // Computed lazily; filled in once we ship streak lookup here.
      checkInUrl: `${siteUrl}/app`,
      unsubscribeUrl: `${siteUrl}/r/unsub?t=${unsubToken}`,
    });

    const result = await sendEmail({
      to: email,
      toName: profile.display_name ?? undefined,
      subject: email_.subject,
      html: email_.html,
      text: email_.text,
      userId: profile.id,
      habitId: habit.id,
      tags: ["reminder", locale],
    });

    if (result.status === "rejected" || result.status === "invalid") {
      await supabase
        .from("reminder_sends")
        .update({
          status: result.status === "rejected" ? "rejected" : "failed",
          provider_id: result.providerId,
          error_message: result.reason.slice(0, 500),
        })
        .eq("id", inserted.id);
      summary.failed += 1;
    } else {
      await supabase
        .from("reminder_sends")
        .update({
          status: "sent",
          provider_id: result.status === "dry_run" ? "dry_run" : result.providerId,
        })
        .eq("id", inserted.id);
      summary.sent += 1;
    }
  }

  return NextResponse.json({ ok: true, summary });
}

function bump(counts: Record<string, number>, key: string) {
  counts[key] = (counts[key] ?? 0) + 1;
}

// Pure decision layer: given a candidate (user, habit) pair and the current
// time, decide whether to send a reminder right now. No I/O — the cron handler
// loads data and persists results; this function only answers yes/no and why.
//
// Kept testable on purpose: like lib/streaks.ts, we'll lean hard on unit tests
// here because getting reminder logic wrong is the category of bug users
// definitely notice (silent failure, 3am wake-up, duplicate sends).

import type { LocalDate } from "@/lib/dates";
import type { ReminderChannel, SendingChannel } from "@/lib/database.types";

export type ReminderCandidate = {
  userId: string;
  habitId: string;
  habitName: string;
  /** Days of the week this habit is scheduled for (0 = Sunday). */
  targetDaysOfWeek: ReadonlyArray<number>;
  /** Optional preferred send time (`HH:MM:SS`, user's local tz). When null we use default window. */
  reminderTime: string | null;
  /** User's IANA timezone (e.g. "America/New_York"). */
  timezone: string;
  locale: "en" | "pt-BR";
  preferredChannel: ReminderChannel;
  quietHoursStart: string | null; // 'HH:MM:SS'
  quietHoursEnd: string | null;
  unsubscribedAt: string | null;
  /** E.164 phone number, only present if the user verified it. */
  phoneE164: string | null;
  /** Opt-in flips true only after OTP verification; cleared on STOP keyword. */
  whatsappOptIn: boolean;
  /** LocalDate strings on which the user has checked in for this habit. */
  checkInDates: ReadonlySet<LocalDate>;
};

export type DispatchDecision =
  | { send: true; channel: SendingChannel; localDate: LocalDate }
  | { send: false; reason: DispatchSkipReason };

export type DispatchSkipReason =
  | "unsubscribed"
  | "channel_none"
  | "whatsapp_not_ready"
  | "already_checked_in"
  | "not_target_day"
  | "quiet_hours"
  | "before_reminder_time";

const DEFAULT_REMINDER_HOUR = 9; // 09:00 local if no per-habit override.

/**
 * Returns the user's wall-clock "HH:MM" in their timezone, as a comparable number of minutes.
 */
function localMinutes(now: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

function localDateIn(timezone: string, now: Date): LocalDate {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function localDayOfWeek(timezone: string, now: Date): number {
  // 0 = Sunday, 6 = Saturday. Intl returns long names; map them.
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "long",
  }).format(now);
  const map: Record<string, number> = {
    Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
    Thursday: 4, Friday: 5, Saturday: 6,
  };
  return map[name] ?? 0;
}

function parseHms(s: string | null): number | null {
  if (!s) return null;
  const match = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(s);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/**
 * True when `minutes` falls inside [start, end). If end < start the window wraps
 * past midnight (e.g. 22:00 → 07:00 means "from 10pm to 7am").
 */
export function isWithinQuietHours(minutes: number, start: number, end: number): boolean {
  if (start === end) return false;
  if (start < end) return minutes >= start && minutes < end;
  return minutes >= start || minutes < end;
}

export function decideDispatch(
  candidate: ReminderCandidate,
  now: Date = new Date(),
): DispatchDecision {
  if (candidate.unsubscribedAt) return { send: false, reason: "unsubscribed" };
  if (candidate.preferredChannel === "none") return { send: false, reason: "channel_none" };
  if (
    candidate.preferredChannel === "whatsapp" &&
    (!candidate.whatsappOptIn || !candidate.phoneE164)
  ) {
    return { send: false, reason: "whatsapp_not_ready" };
  }

  const localDate = localDateIn(candidate.timezone, now);
  if (candidate.checkInDates.has(localDate)) {
    return { send: false, reason: "already_checked_in" };
  }

  const dow = localDayOfWeek(candidate.timezone, now);
  if (!candidate.targetDaysOfWeek.includes(dow)) {
    return { send: false, reason: "not_target_day" };
  }

  const minutes = localMinutes(now, candidate.timezone);
  const quietStart = parseHms(candidate.quietHoursStart);
  const quietEnd = parseHms(candidate.quietHoursEnd);
  if (quietStart !== null && quietEnd !== null && isWithinQuietHours(minutes, quietStart, quietEnd)) {
    return { send: false, reason: "quiet_hours" };
  }

  const reminderMinutes = parseHms(candidate.reminderTime) ?? DEFAULT_REMINDER_HOUR * 60;
  if (minutes < reminderMinutes) {
    return { send: false, reason: "before_reminder_time" };
  }

  return { send: true, channel: candidate.preferredChannel, localDate };
}

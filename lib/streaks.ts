// Pure streak math. No I/O; take a flat list of check-ins and the user's
// "today" string and return derived numbers. The DB layer is responsible
// for passing in only rows the current user owns — this module trusts inputs.

import {
  type LocalDate,
  addDays,
  dayOfWeek,
  formatLocalDate,
  parseLocalDate,
} from "./dates";

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday

/** Hard ceiling on how far back we walk when computing streaks. */
const MAX_WALK_DAYS = 3650;

export type StreakStats = {
  current: number;
  longest: number;
  isDoneToday: boolean;
};

/**
 * @param checkIns  Set of LocalDate strings ('YYYY-MM-DD') on which the user checked in.
 * @param today     The user's current local date (see todayInTimezone).
 * @param targetDaysOfWeek  Which days of the week this habit is expected on (0–6).
 */
export function computeStreaks(
  checkIns: Set<LocalDate>,
  today: LocalDate,
  targetDaysOfWeek: ReadonlyArray<number>,
): StreakStats {
  const targetDays = new Set(targetDaysOfWeek);
  if (targetDays.size === 0) {
    // Edge case: habit with no target days. Everything is 0.
    return { current: 0, longest: 0, isDoneToday: false };
  }

  const isDoneToday = checkIns.has(today);
  const current = currentStreak(checkIns, today, targetDays);
  const longest = longestStreak(checkIns, today, targetDays);
  return { current, longest, isDoneToday };
}

/**
 * Walk backward from today. A "target day" without a check-in ends the streak.
 * "Today" is special-cased: if today is a target day but has no check-in yet,
 * we start walking from yesterday (the streak isn't broken until tomorrow rolls over).
 */
export function currentStreak(
  checkIns: Set<LocalDate>,
  today: LocalDate,
  targetDays: ReadonlySet<number>,
): number {
  let cursor = parseLocalDate(today);
  const todayDow = dayOfWeek(cursor);

  // If today is a target day and the user hasn't checked in yet, don't count today
  // as a gap — start from yesterday.
  if (targetDays.has(todayDow) && !checkIns.has(today)) {
    cursor = addDays(cursor, -1);
  }

  let count = 0;
  for (let i = 0; i < MAX_WALK_DAYS; i++) {
    const dow = dayOfWeek(cursor);
    if (targetDays.has(dow)) {
      const dateStr = formatLocalDate(cursor);
      if (checkIns.has(dateStr)) {
        count++;
      } else {
        break;
      }
    }
    // Non-target day: neither counts nor breaks the streak.
    cursor = addDays(cursor, -1);
  }
  return count;
}

/**
 * Longest historical run. Walk from the earliest check-in to today; for each
 * target day, increment the running count if there's a check-in, reset to 0 otherwise.
 */
export function longestStreak(
  checkIns: Set<LocalDate>,
  today: LocalDate,
  targetDays: ReadonlySet<number>,
): number {
  if (checkIns.size === 0) return 0;

  const sorted = Array.from(checkIns).sort();
  const start = parseLocalDate(sorted[0]);
  const end = parseLocalDate(today);

  if (end < start) return 0;

  let longest = 0;
  let run = 0;
  let cursor = start;

  // Walk day by day. Bounded by MAX_WALK_DAYS to protect against malformed input.
  for (let i = 0; i < MAX_WALK_DAYS; i++) {
    if (cursor > end) break;

    const dow = dayOfWeek(cursor);
    if (targetDays.has(dow)) {
      const dateStr = formatLocalDate(cursor);
      if (checkIns.has(dateStr)) {
        run++;
        if (run > longest) longest = run;
      } else {
        run = 0;
      }
    }
    cursor = addDays(cursor, 1);
  }
  return longest;
}

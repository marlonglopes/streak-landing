// Completion rates and heatmap data. Pure; no I/O.

import {
  type LocalDate,
  addDays,
  dayOfWeek,
  formatLocalDate,
  parseLocalDate,
} from "./dates";

/**
 * Ratio of target-day check-ins to target-day count over the last `windowDays`
 * (inclusive of today). Returns `null` if the window contains zero target days
 * — meaningfully "no data" rather than "0%".
 */
export function completionRate(
  checkIns: Set<LocalDate>,
  today: LocalDate,
  targetDays: ReadonlySet<number>,
  windowDays: number,
): number | null {
  if (windowDays <= 0 || targetDays.size === 0) return null;

  let targetCount = 0;
  let doneCount = 0;
  let cursor = addDays(parseLocalDate(today), -(windowDays - 1));

  for (let i = 0; i < windowDays; i++) {
    if (targetDays.has(dayOfWeek(cursor))) {
      targetCount++;
      if (checkIns.has(formatLocalDate(cursor))) doneCount++;
    }
    cursor = addDays(cursor, 1);
  }

  if (targetCount === 0) return null;
  return doneCount / targetCount;
}

export const weeklyCompletionRate = (
  checkIns: Set<LocalDate>,
  today: LocalDate,
  targetDays: ReadonlySet<number>,
) => completionRate(checkIns, today, targetDays, 7);

export const monthlyCompletionRate = (
  checkIns: Set<LocalDate>,
  today: LocalDate,
  targetDays: ReadonlySet<number>,
) => completionRate(checkIns, today, targetDays, 30);

export type HeatmapCell = {
  date: LocalDate;
  isTarget: boolean;
  isChecked: boolean;
  isFuture: boolean;
  isToday: boolean;
};

/**
 * Build a week-oriented grid for a GitHub-style heatmap.
 *
 * The grid is column-major: each column is one ISO-ish week (Sun→Sat in our
 * 0=Sun convention), each row is a day of the week. The rightmost column
 * contains `today`; the grid extends `weeks` columns to the left.
 *
 * Cells before the habit's history or after today are still present (makes
 * rendering trivial) — the consumer should style `isFuture` cells as blanks
 * and non-target cells as muted.
 */
export function buildHeatmap(
  checkIns: Set<LocalDate>,
  today: LocalDate,
  targetDays: ReadonlySet<number>,
  weeks: number,
): HeatmapCell[][] {
  const todayDate = parseLocalDate(today);
  const todayDow = dayOfWeek(todayDate);

  // Align the last column so that `today` sits at row index `todayDow`.
  // Start date = today minus (weeks-1) full weeks, rewound to Sunday.
  const startOfLastWeek = addDays(todayDate, -todayDow);
  const gridStart = addDays(startOfLastWeek, -(weeks - 1) * 7);

  const columns: HeatmapCell[][] = [];
  let cursor = gridStart;

  for (let w = 0; w < weeks; w++) {
    const column: HeatmapCell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = formatLocalDate(cursor);
      const isFuture = cursor > todayDate;
      column.push({
        date,
        isTarget: targetDays.has(d),
        isChecked: !isFuture && checkIns.has(date),
        isFuture,
        isToday: date === today,
      });
      cursor = addDays(cursor, 1);
    }
    columns.push(column);
  }

  return columns;
}

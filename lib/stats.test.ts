import { describe, it, expect } from "vitest";
import {
  buildHeatmap,
  completionRate,
  monthlyCompletionRate,
  weeklyCompletionRate,
} from "./stats";

const ALL_DAYS = new Set([0, 1, 2, 3, 4, 5, 6]);
const WEEKDAYS = new Set([1, 2, 3, 4, 5]);
const MWF = new Set([1, 3, 5]);

function set(...dates: string[]): Set<string> {
  return new Set(dates);
}

describe("completionRate", () => {
  it("returns null for zero-length window", () => {
    expect(completionRate(set(), "2024-04-10", ALL_DAYS, 0)).toBeNull();
  });

  it("returns null when no target days in the window", () => {
    // A weekly MWF habit, but a 2-day window ending Tue 2024-04-09 → targets
    // inside window: Mon 4/8 (target) → wait, Mon IS a target. Use Sat+Sun instead.
    // Target days = {}; actually pass empty to trigger null via size===0.
    expect(
      completionRate(set(), "2024-04-10", new Set<number>(), 7),
    ).toBeNull();
  });

  it("1.0 when every target day is checked", () => {
    const checks = set(
      "2024-04-04", // Thu
      "2024-04-05", // Fri
      "2024-04-06", // Sat
      "2024-04-07", // Sun
      "2024-04-08", // Mon
      "2024-04-09", // Tue
      "2024-04-10", // Wed (today)
    );
    expect(completionRate(checks, "2024-04-10", ALL_DAYS, 7)).toBe(1);
  });

  it("0 when no target days in window are checked", () => {
    expect(completionRate(set(), "2024-04-10", ALL_DAYS, 7)).toBe(0);
  });

  it("correctly counts partial weeks", () => {
    // 7-day window ending Wed 2024-04-10. Check in Mon, Tue, Wed only.
    const checks = set("2024-04-08", "2024-04-09", "2024-04-10");
    expect(completionRate(checks, "2024-04-10", ALL_DAYS, 7)).toBeCloseTo(
      3 / 7,
    );
  });

  it("respects target days (weekdays-only)", () => {
    // 7-day window ending Wed. Mon 4/8 + Tue 4/9 + Wed 4/10 = 3 target days
    // checked out of 5 (Fri 4/5, Mon 4/8, Tue 4/9, Wed 4/10 fall in window,
    // plus Sat/Sun which are NOT targets). Actually let's enumerate:
    // Window 4/4–4/10 = Thu Fri Sat Sun Mon Tue Wed. Target weekdays in
    // window: Thu, Fri, Mon, Tue, Wed = 5. Checked: Mon, Tue, Wed = 3.
    const checks = set("2024-04-08", "2024-04-09", "2024-04-10");
    expect(completionRate(checks, "2024-04-10", WEEKDAYS, 7)).toBeCloseTo(
      3 / 5,
    );
  });

  it("check-ins outside the window are ignored", () => {
    // Window = 2024-04-04 to 2024-04-10. A check-in from March shouldn't count.
    const checks = set("2024-03-01", "2024-04-10");
    expect(completionRate(checks, "2024-04-10", ALL_DAYS, 7)).toBeCloseTo(
      1 / 7,
    );
  });

  it("30-day monthly rate aligns with completionRate(..., 30)", () => {
    const checks = set("2024-04-10");
    expect(monthlyCompletionRate(checks, "2024-04-10", ALL_DAYS)).toBe(
      completionRate(checks, "2024-04-10", ALL_DAYS, 30),
    );
  });

  it("7-day weekly rate aligns with completionRate(..., 7)", () => {
    const checks = set("2024-04-10");
    expect(weeklyCompletionRate(checks, "2024-04-10", ALL_DAYS)).toBe(
      completionRate(checks, "2024-04-10", ALL_DAYS, 7),
    );
  });

  it("MWF habit: window spanning two target weeks", () => {
    // 14-day window ending Fri 2024-04-12. MWF target days in that window:
    // 4/1 Mon, 4/3 Wed, 4/5 Fri, 4/8 Mon, 4/10 Wed, 4/12 Fri = 6.
    // Checked: 4/1, 4/5, 4/10, 4/12 = 4 of 6.
    const checks = set(
      "2024-04-01",
      "2024-04-05",
      "2024-04-10",
      "2024-04-12",
    );
    expect(completionRate(checks, "2024-04-12", MWF, 14)).toBeCloseTo(4 / 6);
  });
});

describe("buildHeatmap", () => {
  it("produces weeks × 7 cells", () => {
    const grid = buildHeatmap(set(), "2024-04-10", ALL_DAYS, 4);
    expect(grid).toHaveLength(4);
    for (const col of grid) expect(col).toHaveLength(7);
  });

  it("rightmost column contains today at the correct row", () => {
    // 2024-04-10 is a Wednesday (dow = 3).
    const grid = buildHeatmap(set("2024-04-10"), "2024-04-10", ALL_DAYS, 4);
    const lastCol = grid[grid.length - 1];
    expect(lastCol[3].date).toBe("2024-04-10");
    expect(lastCol[3].isToday).toBe(true);
    expect(lastCol[3].isChecked).toBe(true);
    expect(lastCol[3].isFuture).toBe(false);
  });

  it("marks cells after today as future and not checked", () => {
    // The last column contains today + trailing days (Thu, Fri, Sat after
    // today Wed). Those should be isFuture=true.
    const grid = buildHeatmap(
      set("2024-04-11"),
      "2024-04-10",
      ALL_DAYS,
      2,
    );
    const lastCol = grid[grid.length - 1];
    expect(lastCol[4].date).toBe("2024-04-11"); // Thu
    expect(lastCol[4].isFuture).toBe(true);
    expect(lastCol[4].isChecked).toBe(false); // future never shows a check
  });

  it("marks non-target days with isTarget=false", () => {
    const grid = buildHeatmap(set(), "2024-04-10", WEEKDAYS, 1);
    const col = grid[0];
    expect(col[0].isTarget).toBe(false); // Sunday
    expect(col[6].isTarget).toBe(false); // Saturday
    expect(col[3].isTarget).toBe(true); // Wednesday
  });

  it("check-in outside the grid window is ignored", () => {
    // 1 week window ending 2024-04-10. A check-in from March is not in any cell.
    const grid = buildHeatmap(
      set("2024-03-01"),
      "2024-04-10",
      ALL_DAYS,
      1,
    );
    const allCells = grid.flat();
    expect(allCells.some((c) => c.isChecked)) .toBe(false);
  });

  it("dates are chronological — +1 day per row, +1 day between columns", () => {
    const grid = buildHeatmap(set(), "2024-04-10", ALL_DAYS, 3);
    const msPerDay = 86400000;
    for (const col of grid) {
      for (let i = 1; i < 7; i++) {
        const prev = new Date(`${col[i - 1].date}T00:00:00Z`).getTime();
        const curr = new Date(`${col[i].date}T00:00:00Z`).getTime();
        expect((curr - prev) / msPerDay).toBe(1);
      }
    }
    const col0Last = new Date(`${grid[0][6].date}T00:00:00Z`).getTime();
    const col1First = new Date(`${grid[1][0].date}T00:00:00Z`).getTime();
    expect((col1First - col0Last) / msPerDay).toBe(1);
  });
});

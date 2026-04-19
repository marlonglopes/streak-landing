import { describe, it, expect } from "vitest";
import { computeStreaks, currentStreak, longestStreak } from "./streaks";

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const WEEKDAYS = [1, 2, 3, 4, 5];
const MWF = [1, 3, 5]; // Mon/Wed/Fri

function set(...dates: string[]): Set<string> {
  return new Set(dates);
}

describe("computeStreaks", () => {
  it("returns zeros for a habit with no target days", () => {
    const result = computeStreaks(set("2024-04-10"), "2024-04-10", []);
    expect(result).toEqual({ current: 0, longest: 0, isDoneToday: false });
  });

  it("returns zeros with no check-ins", () => {
    const result = computeStreaks(set(), "2024-04-10", ALL_DAYS);
    expect(result).toEqual({ current: 0, longest: 0, isDoneToday: false });
  });

  it("reports isDoneToday correctly", () => {
    const done = computeStreaks(set("2024-04-10"), "2024-04-10", ALL_DAYS);
    expect(done.isDoneToday).toBe(true);

    const notDone = computeStreaks(set("2024-04-09"), "2024-04-10", ALL_DAYS);
    expect(notDone.isDoneToday).toBe(false);
  });
});

describe("currentStreak — daily habit (all 7 days)", () => {
  const targets = new Set(ALL_DAYS);

  it("is 0 when no check-ins", () => {
    expect(currentStreak(set(), "2024-04-10", targets)).toBe(0);
  });

  it("is 1 when only today is checked in", () => {
    expect(currentStreak(set("2024-04-10"), "2024-04-10", targets)).toBe(1);
  });

  it("counts a 5-day run ending today", () => {
    const checks = set(
      "2024-04-06",
      "2024-04-07",
      "2024-04-08",
      "2024-04-09",
      "2024-04-10",
    );
    expect(currentStreak(checks, "2024-04-10", targets)).toBe(5);
  });

  it("today not checked in yet: streak is yesterday's run (not broken)", () => {
    const checks = set("2024-04-08", "2024-04-09");
    expect(currentStreak(checks, "2024-04-10", targets)).toBe(2);
  });

  it("today not checked in + yesterday also missing: streak is 0", () => {
    const checks = set("2024-04-07", "2024-04-08");
    expect(currentStreak(checks, "2024-04-10", targets)).toBe(0);
  });

  it("a single missed day breaks the run", () => {
    const checks = set(
      "2024-04-06",
      "2024-04-07",
      // 2024-04-08 missing
      "2024-04-09",
      "2024-04-10",
    );
    expect(currentStreak(checks, "2024-04-10", targets)).toBe(2);
  });

  it("does not count future check-ins past 'today'", () => {
    const checks = set("2024-04-10", "2024-04-11", "2024-04-12");
    expect(currentStreak(checks, "2024-04-10", targets)).toBe(1);
  });
});

describe("currentStreak — weekdays-only habit (Mon–Fri)", () => {
  const targets = new Set(WEEKDAYS);

  it("weekend non-target days don't break the streak", () => {
    // Fri 4/5, Mon 4/8, Tue 4/9, Wed 4/10 all checked.
    // Sat 4/6 + Sun 4/7 are non-target — should be skipped, not broken.
    const checks = set("2024-04-05", "2024-04-08", "2024-04-09", "2024-04-10");
    expect(currentStreak(checks, "2024-04-10", targets)).toBe(4);
  });

  it("check-ins on non-target days are ignored (neither help nor hurt)", () => {
    // Sat 4/6 check-in shouldn't count toward Mon–Fri streak.
    const checks = set(
      "2024-04-05", // Fri
      "2024-04-06", // Sat — non-target
      "2024-04-08", // Mon
      "2024-04-09", // Tue
      "2024-04-10", // Wed (today)
    );
    expect(currentStreak(checks, "2024-04-10", targets)).toBe(4);
  });

  it("on Saturday (non-target), streak reflects Fri's run", () => {
    // Today = Sat. Fri + Thu + Wed checked in. Sat is non-target, so it neither
    // counts nor breaks.
    const checks = set("2024-04-03", "2024-04-04", "2024-04-05");
    expect(currentStreak(checks, "2024-04-06", targets)).toBe(3);
  });

  it("missed Friday breaks streak even if Mon–Thu were perfect", () => {
    const checks = set(
      "2024-04-01",
      "2024-04-02",
      "2024-04-03",
      "2024-04-04",
      // Fri 4/5 missing
      "2024-04-08",
      "2024-04-09",
      "2024-04-10",
    );
    expect(currentStreak(checks, "2024-04-10", targets)).toBe(3);
  });
});

describe("currentStreak — Mon/Wed/Fri habit", () => {
  const targets = new Set(MWF);

  it("counts only target days in the run", () => {
    // Mon 4/1, Wed 4/3, Fri 4/5, Mon 4/8, Wed 4/10 (today).
    const checks = set(
      "2024-04-01",
      "2024-04-03",
      "2024-04-05",
      "2024-04-08",
      "2024-04-10",
    );
    expect(currentStreak(checks, "2024-04-10", targets)).toBe(5);
  });

  it("missed Wednesday breaks the run", () => {
    const checks = set(
      "2024-04-01", // Mon
      // Wed 4/3 missing
      "2024-04-05", // Fri
      "2024-04-08", // Mon
      "2024-04-10", // Wed today
    );
    expect(currentStreak(checks, "2024-04-10", targets)).toBe(3);
  });
});

describe("currentStreak — DST transitions", () => {
  const targets = new Set(ALL_DAYS);

  it("US spring-forward (2024-03-10) doesn't drop a day", () => {
    const checks = set(
      "2024-03-08",
      "2024-03-09",
      "2024-03-10",
      "2024-03-11",
    );
    expect(currentStreak(checks, "2024-03-11", targets)).toBe(4);
  });

  it("US fall-back (2024-11-03) doesn't double-count", () => {
    const checks = set(
      "2024-11-01",
      "2024-11-02",
      "2024-11-03",
      "2024-11-04",
    );
    expect(currentStreak(checks, "2024-11-04", targets)).toBe(4);
  });
});

describe("longestStreak", () => {
  const targets = new Set(ALL_DAYS);

  it("is 0 with no check-ins", () => {
    expect(longestStreak(set(), "2024-04-10", targets)).toBe(0);
  });

  it("finds a historical run that is longer than the current one", () => {
    // Historical 5-run in March, current 2-run in April.
    const checks = set(
      "2024-03-01",
      "2024-03-02",
      "2024-03-03",
      "2024-03-04",
      "2024-03-05",
      // gap
      "2024-04-09",
      "2024-04-10",
    );
    expect(longestStreak(checks, "2024-04-10", targets)).toBe(5);
  });

  it("equals the current streak if it's the only run", () => {
    const checks = set("2024-04-08", "2024-04-09", "2024-04-10");
    expect(longestStreak(checks, "2024-04-10", targets)).toBe(3);
  });

  it("ignores check-ins after 'today'", () => {
    // Future check-ins shouldn't inflate longest — walking stops at today.
    const checks = set(
      "2024-04-09",
      "2024-04-10",
      "2024-04-11",
      "2024-04-12",
      "2024-04-13",
    );
    expect(longestStreak(checks, "2024-04-10", targets)).toBe(2);
  });

  it("returns 0 when today is before the earliest check-in", () => {
    const checks = set("2024-05-01");
    expect(longestStreak(checks, "2024-04-01", targets)).toBe(0);
  });
});

describe("longestStreak — weekly habit", () => {
  const targets = new Set(MWF);

  it("counts only target-day check-ins in the run", () => {
    // Three Mon/Wed/Fri runs: 3, 1, 5. Longest = 5.
    const checks = set(
      // Run of 3
      "2024-03-04", // Mon
      "2024-03-06", // Wed
      "2024-03-08", // Fri
      // miss Mon 3/11 → reset
      "2024-03-13", // Wed — run of 1
      // miss Fri 3/15 → reset
      // Run of 5
      "2024-03-18", // Mon
      "2024-03-20", // Wed
      "2024-03-22", // Fri
      "2024-03-25", // Mon
      "2024-03-27", // Wed
    );
    expect(longestStreak(checks, "2024-04-01", targets)).toBe(5);
  });

  it("extra check-ins on non-target days don't inflate the count", () => {
    // Saturday check-in should be ignored entirely.
    const checks = set(
      "2024-03-04", // Mon
      "2024-03-06", // Wed
      "2024-03-08", // Fri
      "2024-03-09", // Sat — non-target, ignored
      "2024-03-11", // Mon
    );
    expect(longestStreak(checks, "2024-03-15", targets)).toBe(4);
  });
});

describe("computeStreaks — integration", () => {
  it("weekdays habit, mid-week, all caught up", () => {
    // Today = Wed 2024-04-10. Checked in Mon, Tue, Wed. Previous week also perfect.
    const checks = set(
      "2024-04-01",
      "2024-04-02",
      "2024-04-03",
      "2024-04-04",
      "2024-04-05",
      "2024-04-08",
      "2024-04-09",
      "2024-04-10",
    );
    const result = computeStreaks(checks, "2024-04-10", WEEKDAYS);
    expect(result).toEqual({ current: 8, longest: 8, isDoneToday: true });
  });

  it("daily habit, skipped yesterday, checked in today", () => {
    // Gap broke the streak; today restarts it at 1.
    const checks = set(
      "2024-04-05",
      "2024-04-06",
      "2024-04-07",
      // 4/8 + 4/9 missed
      "2024-04-10",
    );
    const result = computeStreaks(checks, "2024-04-10", ALL_DAYS);
    expect(result).toEqual({ current: 1, longest: 3, isDoneToday: true });
  });
});

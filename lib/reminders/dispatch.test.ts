import { describe, it, expect } from "vitest";
import {
  type ReminderCandidate,
  decideDispatch,
  isWithinQuietHours,
} from "./dispatch";

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6] as const;

function base(overrides: Partial<ReminderCandidate> = {}): ReminderCandidate {
  return {
    userId: "u1",
    habitId: "h1",
    habitName: "Meditate",
    targetDaysOfWeek: ALL_DAYS,
    reminderTime: null,
    timezone: "UTC",
    locale: "en",
    preferredChannel: "email",
    quietHoursStart: null,
    quietHoursEnd: null,
    unsubscribedAt: null,
    checkInDates: new Set<string>(),
    ...overrides,
  };
}

// 2024-04-10 is a Wednesday (UTC).
const WED_10AM = new Date("2024-04-10T10:00:00.000Z");

describe("decideDispatch", () => {
  it("sends on the happy path", () => {
    const decision = decideDispatch(base(), WED_10AM);
    expect(decision).toEqual({ send: true, channel: "email", localDate: "2024-04-10" });
  });

  it("skips when user is unsubscribed", () => {
    const decision = decideDispatch(base({ unsubscribedAt: "2024-04-01T00:00:00Z" }), WED_10AM);
    expect(decision).toEqual({ send: false, reason: "unsubscribed" });
  });

  it("skips when preferred channel is none", () => {
    const decision = decideDispatch(base({ preferredChannel: "none" }), WED_10AM);
    expect(decision).toEqual({ send: false, reason: "channel_none" });
  });

  it("skips when already checked in today", () => {
    const decision = decideDispatch(
      base({ checkInDates: new Set(["2024-04-10"]) }),
      WED_10AM,
    );
    expect(decision).toEqual({ send: false, reason: "already_checked_in" });
  });

  it("skips when today isn't a target day", () => {
    // Wednesday is day 3. Target only Mon/Fri.
    const decision = decideDispatch(base({ targetDaysOfWeek: [1, 5] }), WED_10AM);
    expect(decision).toEqual({ send: false, reason: "not_target_day" });
  });

  it("skips inside a non-wrapping quiet window", () => {
    // 10:00 falls inside 09:00–12:00.
    const decision = decideDispatch(
      base({ quietHoursStart: "09:00:00", quietHoursEnd: "12:00:00" }),
      WED_10AM,
    );
    expect(decision).toEqual({ send: false, reason: "quiet_hours" });
  });

  it("sends outside a non-wrapping quiet window", () => {
    const decision = decideDispatch(
      base({ quietHoursStart: "20:00:00", quietHoursEnd: "23:00:00" }),
      WED_10AM,
    );
    expect(decision.send).toBe(true);
  });

  it("skips inside a quiet window that wraps past midnight", () => {
    // 22:00–07:00 window, current time 02:00 UTC → inside.
    const wedEarly = new Date("2024-04-10T02:00:00.000Z");
    const decision = decideDispatch(
      base({ quietHoursStart: "22:00:00", quietHoursEnd: "07:00:00" }),
      wedEarly,
    );
    expect(decision).toEqual({ send: false, reason: "quiet_hours" });
  });

  it("sends after the habit's reminder_time has passed", () => {
    const decision = decideDispatch(
      base({ reminderTime: "09:00:00" }),
      WED_10AM,
    );
    expect(decision.send).toBe(true);
  });

  it("skips before the habit's reminder_time", () => {
    const decision = decideDispatch(
      base({ reminderTime: "11:00:00" }),
      WED_10AM,
    );
    expect(decision).toEqual({ send: false, reason: "before_reminder_time" });
  });

  it("honors the user timezone for 'today' and local wall-clock", () => {
    // 2024-04-10T02:00Z is still 2024-04-09 22:00 in America/New_York.
    const decision = decideDispatch(
      base({
        timezone: "America/New_York",
        targetDaysOfWeek: [2], // Tuesday in NY
      }),
      new Date("2024-04-10T02:00:00.000Z"),
    );
    // Tuesday 22:00 NY → target day matches, past default 09:00 reminder → send.
    expect(decision).toEqual({ send: true, channel: "email", localDate: "2024-04-09" });
  });

  it("defaults the send time to 09:00 when reminder_time is null", () => {
    // 08:30 UTC, no override → before default 09:00, skip.
    const decision = decideDispatch(base(), new Date("2024-04-10T08:30:00.000Z"));
    expect(decision).toEqual({ send: false, reason: "before_reminder_time" });
  });
});

describe("isWithinQuietHours", () => {
  it("returns false when start === end", () => {
    expect(isWithinQuietHours(600, 600, 600)).toBe(false);
  });

  it("inclusive start, exclusive end for non-wrap windows", () => {
    expect(isWithinQuietHours(540, 540, 720)).toBe(true); // 09:00 in [09:00, 12:00)
    expect(isWithinQuietHours(720, 540, 720)).toBe(false); // 12:00 is exclusive
    expect(isWithinQuietHours(480, 540, 720)).toBe(false); // 08:00 before window
  });

  it("handles windows that wrap past midnight", () => {
    // 22:00 → 07:00
    expect(isWithinQuietHours(23 * 60, 22 * 60, 7 * 60)).toBe(true);
    expect(isWithinQuietHours(1 * 60, 22 * 60, 7 * 60)).toBe(true);
    expect(isWithinQuietHours(7 * 60, 22 * 60, 7 * 60)).toBe(false);
    expect(isWithinQuietHours(12 * 60, 22 * 60, 7 * 60)).toBe(false);
  });
});

import { describe, it, expect } from "vitest";
import {
  addDays,
  dayOfWeek,
  formatLocalDate,
  isValidTimezone,
  parseLocalDate,
  todayInTimezone,
} from "./dates";

describe("todayInTimezone", () => {
  it("returns YYYY-MM-DD in the requested timezone", () => {
    // 2024-03-10 03:00 UTC = 2024-03-09 23:00 EST (still Saturday night in NY)
    const utcInstant = new Date("2024-03-10T03:00:00Z");
    expect(todayInTimezone("America/New_York", utcInstant)).toBe("2024-03-09");
    expect(todayInTimezone("UTC", utcInstant)).toBe("2024-03-10");
  });

  it("handles positive offsets (Tokyo)", () => {
    // 2024-01-01 16:00 UTC = 2024-01-02 01:00 JST
    const utcInstant = new Date("2024-01-01T16:00:00Z");
    expect(todayInTimezone("Asia/Tokyo", utcInstant)).toBe("2024-01-02");
  });

  it("handles non-whole-hour offsets (India)", () => {
    // 2024-01-01 18:00 UTC = 2024-01-01 23:30 IST — still same day
    // 2024-01-01 18:45 UTC = 2024-01-02 00:15 IST — crosses midnight
    expect(
      todayInTimezone("Asia/Kolkata", new Date("2024-01-01T18:00:00Z")),
    ).toBe("2024-01-01");
    expect(
      todayInTimezone("Asia/Kolkata", new Date("2024-01-01T18:45:00Z")),
    ).toBe("2024-01-02");
  });
});

describe("parseLocalDate / formatLocalDate", () => {
  it("round-trips 'YYYY-MM-DD'", () => {
    expect(formatLocalDate(parseLocalDate("2024-06-15"))).toBe("2024-06-15");
  });

  it("rejects malformed input", () => {
    expect(() => parseLocalDate("2024-6-15")).toThrow();
    expect(() => parseLocalDate("bad")).toThrow();
  });
});

describe("addDays", () => {
  it("adds positive days", () => {
    expect(formatLocalDate(addDays(parseLocalDate("2024-02-28"), 1))).toBe(
      "2024-02-29",
    );
  });

  it("subtracts days", () => {
    expect(formatLocalDate(addDays(parseLocalDate("2024-03-01"), -1))).toBe(
      "2024-02-29",
    );
  });

  it("handles leap-year rollover", () => {
    expect(formatLocalDate(addDays(parseLocalDate("2024-02-29"), 365))).toBe(
      "2025-02-28",
    );
  });

  it("handles year rollover", () => {
    expect(formatLocalDate(addDays(parseLocalDate("2024-12-31"), 1))).toBe(
      "2025-01-01",
    );
  });

  it("does not drift across a DST transition (UTC-based arithmetic)", () => {
    // 2024-03-10 is the US DST "spring forward" day.
    expect(formatLocalDate(addDays(parseLocalDate("2024-03-09"), 1))).toBe(
      "2024-03-10",
    );
    expect(formatLocalDate(addDays(parseLocalDate("2024-03-10"), 1))).toBe(
      "2024-03-11",
    );
  });
});

describe("dayOfWeek", () => {
  it("returns 0 for Sunday and 6 for Saturday", () => {
    expect(dayOfWeek("2024-04-07")).toBe(0); // Sunday
    expect(dayOfWeek("2024-04-08")).toBe(1); // Monday
    expect(dayOfWeek("2024-04-13")).toBe(6); // Saturday
  });
});

describe("isValidTimezone", () => {
  it("accepts real IANA zones", () => {
    expect(isValidTimezone("America/New_York")).toBe(true);
    expect(isValidTimezone("UTC")).toBe(true);
    expect(isValidTimezone("Asia/Kolkata")).toBe(true);
  });

  it("rejects garbage", () => {
    expect(isValidTimezone("Mars/Olympus")).toBe(false);
    expect(isValidTimezone("")).toBe(false);
  });
});

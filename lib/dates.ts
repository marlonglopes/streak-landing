// Pure date utilities. No Date-constructor-with-timezone tricks; we treat
// local_date values as opaque 'YYYY-MM-DD' strings and do arithmetic in UTC
// so DST and non-whole-hour offsets (e.g. Asia/Kolkata) never bite us.

export type LocalDate = string; // 'YYYY-MM-DD'

/** Returns the current calendar date in the given IANA timezone. */
export function todayInTimezone(timezone: string, now: Date = new Date()): LocalDate {
  // 'en-CA' locale formats dates as 'YYYY-MM-DD'.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Parses 'YYYY-MM-DD' into a Date representing UTC midnight of that day. */
export function parseLocalDate(s: LocalDate): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    throw new Error(`Invalid local date: ${s}`);
  }
  return new Date(`${s}T00:00:00.000Z`);
}

/** Formats a Date (UTC) back to 'YYYY-MM-DD'. */
export function formatLocalDate(d: Date): LocalDate {
  return d.toISOString().slice(0, 10);
}

/** Returns a new Date N days after d (UTC arithmetic). */
export function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setUTCDate(next.getUTCDate() + n);
  return next;
}

/** Day of week (0=Sun, 6=Sat) for a local_date, from its UTC-midnight Date. */
export function dayOfWeek(d: Date | LocalDate): number {
  const date = typeof d === "string" ? parseLocalDate(d) : d;
  return date.getUTCDay();
}

/** True if the given string is a valid IANA timezone identifier. */
export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

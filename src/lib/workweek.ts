export const WORKWEEK_TIME_ZONE = "Asia/Jerusalem";
export const WORK_DAYS = [0, 1, 2, 3, 4] as const;

export type Workday = (typeof WORK_DAYS)[number];
export type IsoWorkweek = { year: number; week: number };
export type WorkweekRange = { start: Date; end: Date; monday: Date };

const DAY_MS = 86_400_000;

function calendarDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

function addCalendarDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/**
 * Returns the calendar date visible in the requested timezone as a UTC-midnight
 * Date. The Date is intentionally a date-only carrier; all consumers must use
 * UTC getters/formatting so it cannot shift to a neighboring calendar day.
 */
export function getZonedCalendarDate(
  instant: Date = new Date(),
  timeZone = WORKWEEK_TIME_ZONE,
): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return calendarDate(value("year"), value("month"), value("day"));
}

/** ISO year/week for a date-only value represented at UTC midnight. */
export function getISOWeekForCalendarDate(date: Date): IsoWorkweek {
  const d = calendarDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
  const isoDay = d.getUTCDay() || 7;
  const thursday = addCalendarDays(d, 4 - isoDay);
  const year = thursday.getUTCFullYear();
  const yearStart = calendarDate(year, 1, 1);
  const week = Math.ceil(((thursday.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7);
  return { year, week };
}

/**
 * Workweeks run Sunday–Thursday, but their displayed number is the ISO week
 * number of the Monday inside that workweek. This means Sunday belongs to the
 * ISO week beginning the following day, not the previous ISO week.
 */
export function getWorkweekForInstant(
  instant: Date = new Date(),
  timeZone = WORKWEEK_TIME_ZONE,
): IsoWorkweek {
  const localDate = getZonedCalendarDate(instant, timeZone);
  const sunday = addCalendarDays(localDate, -localDate.getUTCDay());
  const monday = addCalendarDays(sunday, 1);
  return getISOWeekForCalendarDate(monday);
}

export function isoWeekToWorkweekRange(year: number, week: number): WorkweekRange {
  const jan4 = calendarDate(year, 1, 4);
  const jan4IsoDay = jan4.getUTCDay() || 7;
  const firstMonday = addCalendarDays(jan4, 1 - jan4IsoDay);
  const monday = addCalendarDays(firstMonday, (week - 1) * 7);
  return {
    start: addCalendarDays(monday, -1),
    monday,
    end: addCalendarDays(monday, 3),
  };
}

export function shiftWorkweek(year: number, week: number, delta: number): IsoWorkweek {
  const { monday } = isoWeekToWorkweekRange(year, week);
  return getISOWeekForCalendarDate(addCalendarDays(monday, delta * 7));
}

export function workdayDate(range: WorkweekRange, day: Workday): Date {
  return addCalendarDays(range.start, day);
}

export function formatWorkDate(
  date: Date,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  },
): string {
  return new Intl.DateTimeFormat("he-IL", { ...options, timeZone: "UTC" }).format(date);
}

/**
 * Working-time arithmetic for Axxion SLAs: Monday to Saturday, 09:00–18:00
 * Dubai (UTC+4, no daylight saving). All SLA windows count only these hours.
 */

const MIN = 60_000;
export const HOUR = 60 * MIN;
const OFFSET = 4 * HOUR; // Dubai is UTC+4 all year
const OPEN = 9 * HOUR;
const CLOSE = 18 * HOUR;
export const WORKDAY_HOURS = 9;

const local = (ms: number) => ms + OFFSET;
const utc = (ms: number) => ms - OFFSET;
const dayStart = (l: number) => l - (((l % (24 * HOUR)) + 24 * HOUR) % (24 * HOUR));
const isWorkday = (l: number) => new Date(l).getUTCDay() !== 0; // Sunday off

/** Move forward to the next moment that is inside working hours. */
function nextOpen(l: number): number {
  for (let i = 0; i < 14; i++) {
    const start = dayStart(l);
    const tod = l - start;
    if (isWorkday(l) && tod >= OPEN && tod < CLOSE) return l;
    if (isWorkday(l) && tod < OPEN) return start + OPEN;
    l = start + 24 * HOUR + OPEN;
    if (isWorkday(l)) return l;
  }
  return l;
}

/** Move back to the latest moment that is inside working hours (or its close). */
function prevClose(l: number): number {
  for (let i = 0; i < 14; i++) {
    const start = dayStart(l);
    const tod = l - start;
    if (isWorkday(l) && tod > OPEN && tod <= CLOSE) return l;
    if (isWorkday(l) && tod > CLOSE) return start + CLOSE;
    l = start - 24 * HOUR + CLOSE;
    if (isWorkday(l)) return l;
  }
  return l;
}

/** The moment `hours` working hours after `from`. */
export function addWorking(from: Date | number, hours: number): Date {
  let l = nextOpen(local(+from));
  let left = hours * HOUR;
  for (let i = 0; i < 400 && left > 0; i++) {
    const room = dayStart(l) + CLOSE - l;
    if (left <= room) return new Date(utc(l + left));
    left -= room;
    l = nextOpen(dayStart(l) + 24 * HOUR);
  }
  return new Date(utc(l));
}

/** The moment `hours` working hours before `to`. */
export function subWorking(to: Date | number, hours: number): Date {
  let l = prevClose(local(+to));
  let left = hours * HOUR;
  for (let i = 0; i < 400 && left > 0; i++) {
    const room = l - (dayStart(l) + OPEN);
    if (left <= room) return new Date(utc(l - left));
    left -= room;
    l = prevClose(dayStart(l) - 1);
  }
  return new Date(utc(l));
}

/** Working hours between two moments (negative if `to` is before `from`). */
export function workingBetween(from: Date | number, to: Date | number): number {
  const a = +from;
  const b = +to;
  if (b < a) return -workingBetween(b, a);
  let total = 0;
  let l = local(a);
  const end = local(b);
  for (let i = 0; i < 400 && l < end; i++) {
    const start = dayStart(l);
    if (isWorkday(l)) {
      const s = Math.max(l, start + OPEN);
      const e = Math.min(end, start + CLOSE);
      if (e > s) total += e - s;
    }
    l = start + 24 * HOUR;
  }
  return total / HOUR;
}

/** 18:00 Dubai today (the end of today's working day). */
export function endOfWorkingDay(now: Date | number): Date {
  return new Date(utc(dayStart(local(+now)) + CLOSE));
}

/** 00:00 Dubai today. */
export function startOfDubaiDay(now: Date | number): Date {
  return new Date(utc(dayStart(local(+now))));
}

/** "40 min", "5 h 20 min", "2.5 working days" (a working day is 9 h). */
export function formatWorking(hours: number): string {
  const h = Math.abs(hours);
  if (h < 1) return `${Math.max(1, Math.round(h * 60))} min`;
  if (h < WORKDAY_HOURS * 2) {
    const whole = Math.floor(h);
    const m = Math.round((h - whole) * 60);
    return m ? `${whole} h ${m} min` : `${whole} h`;
  }
  const d = h / WORKDAY_HOURS;
  return `${d % 1 < 0.05 ? d.toFixed(0) : d.toFixed(1)} working days`;
}

/** Format a time in Dubai, e.g. "Sat 28 Nov, 11:30". */
export function dubaiTime(d: Date | number | string, opts: Intl.DateTimeFormatOptions = {}): string {
  return new Date(d).toLocaleString("en-GB", {
    timeZone: "Asia/Dubai",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    ...opts,
  });
}

/**
 * End of the working day that "today's" work belongs to: 18:00 today during
 * or before working hours on a working day, otherwise 18:00 on the next
 * working day (so after 18:00 or on Sunday, "today" means the next day).
 */
export function currentWorkdayEnd(now: Date | number): Date {
  const l = local(+now);
  const tod = l - dayStart(l);
  if (isWorkday(l) && tod < CLOSE) return new Date(utc(dayStart(l) + CLOSE));
  const next = nextOpen(dayStart(l) + 24 * HOUR);
  return new Date(utc(dayStart(next) + CLOSE));
}

/** True when both moments fall on the same Dubai calendar day. */
export function sameDubaiDay(a: Date | number, b: Date | number): boolean {
  return dayStart(local(+a)) === dayStart(local(+b));
}

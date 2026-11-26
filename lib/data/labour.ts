/**
 * Mock labour usage for 2026: the share of each productive person's available
 * hours that were booked to jobs, per month. Generated deterministically from
 * a seasonal curve per trade plus a small per-person offset, so the numbers are
 * stable between runs.
 */

export const LABOUR_YEAR = 2026;
/** Months with data so far (Jan..Nov; today is late November). */
export const LABOUR_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
const WORKING_DAYS = [21, 20, 22, 21, 20, 22, 23, 21, 22, 21, 21];
const HOURS_PER_DAY = 7.6;

export const LABOUR_TARGET = 80;

/** Productive trades, in display order, with the titles that belong to each. */
export const TRADES: { trade: string; titles: string[]; curve: number[] }[] = [
  {
    trade: "Technicians",
    titles: ["Technician"],
    curve: [74, 78, 86, 82, 76, 72, 74, 80, 84, 90, 86],
  },
  {
    trade: "Denters",
    titles: ["Denter"],
    curve: [88, 80, 76, 72, 78, 90, 95, 86, 78, 74, 84],
  },
  {
    trade: "Painters",
    titles: ["Painter"],
    curve: [86, 78, 74, 70, 76, 88, 93, 88, 80, 72, 82],
  },
  {
    trade: "Electricians",
    titles: ["Electrician"],
    curve: [70, 72, 74, 78, 82, 86, 80, 76, 74, 76, 78],
  },
  {
    trade: "EV HV Electricians",
    titles: ["EV High-Voltage (HV) Electrician"],
    curve: [58, 62, 66, 70, 74, 78, 82, 86, 88, 92, 95],
  },
];

/** Per-person offset to the trade curve (percentage points). */
const OFFSETS: Record<string, number> = {
  "jake-morrison": 4,
  "ravi-patel": 1,
  "emily-chen": -2,
  "noah-kaur": -14, // apprentice
  "sam-dawson": 3,
  "isla-murphy": 0,
  "mateo-alvarez": -5,
  "luca-ferrari": 4,
  "grace-oneill": -1,
  "kai-tanaka": -4,
  "ben-carter": 3,
  "hannah-lee": -3,
  "omar-haddad": 2,
  "zoe-mitchell": -3,
};

/** Small deterministic wobble in [-3, 3] so rows are not identical. */
function wobble(id: string, month: number): number {
  let h = 2166136261;
  for (const ch of `${id}:${month}`) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 7) - 3;
}

export function availableHours(month: number): number {
  return WORKING_DAYS[month] * HOURS_PER_DAY;
}

export function monthlyUsage(personId: string, curve: number[]): number[] {
  const offset = OFFSETS[personId] ?? 0;
  return curve.map((base, m) =>
    Math.max(40, Math.min(100, base + offset + wobble(personId, m))),
  );
}

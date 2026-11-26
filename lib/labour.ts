import {
  LABOUR_MONTHS,
  LABOUR_TARGET,
  LABOUR_YEAR,
  TRADES,
  availableHours,
  monthlyUsage,
} from "@/lib/data/labour";
import { getAllPeople, type Person } from "@/lib/org";

export { LABOUR_MONTHS, LABOUR_TARGET, LABOUR_YEAR } from "@/lib/data/labour";

export type PersonUsage = {
  person: Person;
  trade: string;
  months: number[]; // % per month
  average: number; // hours-weighted
  bookedHours: number;
};

export type TradeUsage = {
  trade: string;
  people: PersonUsage[];
  months: number[];
  average: number;
};

const HOURS = LABOUR_MONTHS.map((_, m) => availableHours(m));
const TOTAL_HOURS = HOURS.reduce((a, b) => a + b, 0);

const weighted = (months: number[]) =>
  months.reduce((s, v, m) => s + v * HOURS[m], 0) / TOTAL_HOURS;

export function getTradeUsage(): TradeUsage[] {
  const people = getAllPeople();
  return TRADES.map(({ trade, titles, curve }) => {
    const members: PersonUsage[] = people
      .filter((p) => titles.includes(p.title))
      .map((person) => {
        const months = monthlyUsage(person.id, curve);
        return {
          person,
          trade,
          months,
          average: weighted(months),
          bookedHours: months.reduce((s, v, m) => s + (v / 100) * HOURS[m], 0),
        };
      })
      .sort((a, b) => b.average - a.average);
    const months = LABOUR_MONTHS.map(
      (_, m) => members.reduce((s, p) => s + p.months[m], 0) / members.length,
    );
    return { trade, people: members, months, average: weighted(months) };
  });
}

export function getLabourSummary() {
  const trades = getTradeUsage();
  const everyone = trades.flatMap((t) => t.people);
  const monthly = LABOUR_MONTHS.map(
    (_, m) => everyone.reduce((s, p) => s + p.months[m], 0) / everyone.length,
  );
  const last = LABOUR_MONTHS.length - 1;
  const busiestMonthIndex = monthly.indexOf(Math.max(...monthly));
  const busiestTradeNow = [...trades].sort((a, b) => b.months[last] - a.months[last])[0];
  return {
    year: LABOUR_YEAR,
    headcount: everyone.length,
    average: weighted(monthly),
    monthly,
    current: { month: LABOUR_MONTHS[last], value: monthly[last] },
    busiestMonth: { month: LABOUR_MONTHS[busiestMonthIndex], value: monthly[busiestMonthIndex] },
    busiestTradeNow: { trade: busiestTradeNow.trade, value: busiestTradeNow.months[last] },
    bookedHours: everyone.reduce((s, p) => s + p.bookedHours, 0),
    target: LABOUR_TARGET,
  };
}

/**
 * Sequential blue bins (validated ramp, light->dark). Lightest = least busy.
 * `ink` keeps cell text readable on each step.
 */
export const USAGE_BINS = [
  { min: 0, label: "Under 65%", fill: "#cde2fb", ink: "#0d366b" },
  { min: 65, label: "65–74%", fill: "#86b6ef", ink: "#0d366b" },
  { min: 75, label: "75–84%", fill: "#3987e5", ink: "#ffffff" },
  { min: 85, label: "85–94%", fill: "#1c5cab", ink: "#ffffff" },
  { min: 95, label: "95%+", fill: "#0d366b", ink: "#ffffff" },
] as const;

export function usageBin(value: number) {
  let bin: (typeof USAGE_BINS)[number] = USAGE_BINS[0];
  for (const b of USAGE_BINS) if (value >= b.min) bin = b;
  return bin;
}

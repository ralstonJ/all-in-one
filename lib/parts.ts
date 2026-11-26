import {
  PARTS_CATEGORIES,
  PARTS_CURRENCY,
  PARTS_MONTHS,
  PARTS_YEAR,
  TOP_PARTS,
} from "@/lib/data/parts";

export { PARTS_CURRENCY, PARTS_MONTHS, PARTS_YEAR, TOP_PARTS } from "@/lib/data/parts";

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export function formatMoney(value: number, compact = false) {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: PARTS_CURRENCY,
    maximumFractionDigits: compact && value >= 1000 ? 1 : 0,
    notation: compact ? "compact" : "standard",
  }).format(value);
}

export function getPartsSummary() {
  const monthly = PARTS_MONTHS.map((_, m) => sum(PARTS_CATEGORIES.map((c) => c.monthly[m])));
  const total = sum(monthly);
  const last = monthly.length - 1;
  const categories = PARTS_CATEGORIES.map((c) => ({
    ...c,
    total: sum(c.monthly),
    share: sum(c.monthly) / total,
    growth: c.monthly[last] / c.monthly[0] - 1,
  })).sort((a, b) => b.total - a.total);

  const areas = new Map<string, number>();
  for (const c of categories) areas.set(c.area, (areas.get(c.area) ?? 0) + c.total);

  const peak = monthly.indexOf(Math.max(...monthly));
  return {
    year: PARTS_YEAR,
    monthly,
    total,
    averageMonth: total / monthly.length,
    current: { month: PARTS_MONTHS[last], value: monthly[last] },
    previous: { month: PARTS_MONTHS[last - 1], value: monthly[last - 1] },
    changeVsPrevious: monthly[last] / monthly[last - 1] - 1,
    peak: { month: PARTS_MONTHS[peak], value: monthly[peak] },
    categories,
    areas: [...areas.entries()]
      .map(([area, value]) => ({ area, value, share: value / total }))
      .sort((a, b) => b.value - a.value),
    topParts: TOP_PARTS,
  };
}

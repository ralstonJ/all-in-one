import Link from "next/link";
import type { Range } from "@/lib/axxion/workflow";

const RANGE_LABEL: Record<Range, string> = { day: "Today", week: "Last 7 days", month: "Last 30 days" };


export function RangeTabs({ range, tab }: { range: Range; tab?: string }) {
  return (
    <div role="tablist" aria-label="Period" className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5">
      {(Object.keys(RANGE_LABEL) as Range[]).map((r) => (
        <Link
          key={r}
          role="tab"
          aria-selected={r === range}
          href={`/axxion/home?${tab ? `tab=${tab}&` : ""}range=${r}`}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${r === range ? "bg-[#0b1f3a] text-white" : "text-slate-600 hover:bg-slate-100"}`}
        >
          {r === "day" ? "Daily" : r === "week" ? "Weekly" : "Monthly"}
        </Link>
      ))}
    </div>
  );
}

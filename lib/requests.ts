/**
 * Request types shown in Approvals and the Clock page: labels, colours and a
 * one-line summary. No server-only imports, so client forms can use it too.
 */
import { formatMoney } from "@/lib/parts";
import type { Approval, ApprovalType } from "@/lib/time-store";

export const TYPE_LABEL: Record<ApprovalType, string> = {
  correction: "Missed clock",
  overtime: "Overtime",
  leave: "Leave",
  parts: "Parts",
  equipment: "Equipment",
  expense: "Expense",
  travel: "Travel",
};

export const TYPE_STYLE: Record<ApprovalType, string> = {
  correction: "bg-sky-50 text-sky-700",
  overtime: "bg-amber-50 text-amber-800",
  leave: "bg-violet-50 text-violet-700",
  parts: "bg-orange-50 text-orange-800",
  equipment: "bg-teal-50 text-teal-800",
  expense: "bg-emerald-50 text-emerald-800",
  travel: "bg-indigo-50 text-indigo-700",
};

export const EXPENSE_CATEGORIES = ["Fuel", "Tools", "Safety", "Software", "Meals", "Other"];

export function shortDay(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function dayCount(from: string, to: string) {
  const [a, b] = [from, to].map((k) => {
    const [y, m, d] = k.split("-").map(Number);
    return new Date(y, m - 1, d).getTime();
  });
  return Math.round((b - a) / 86400000) + 1;
}

function range(a: Approval) {
  return a.endDate && a.endDate !== a.date
    ? `${shortDay(a.date)} – ${shortDay(a.endDate)}`
    : shortDay(a.date);
}

export function requestSummary(a: Approval): string {
  const money = a.amount !== undefined ? formatMoney(a.amount) : null;
  switch (a.type) {
    case "leave": {
      const days = dayCount(a.date, a.endDate ?? a.date);
      return `${a.leaveKind} leave · ${range(a)} · ${days} ${days === 1 ? "day" : "days"}`;
    }
    case "overtime":
      return `${a.hours}h overtime on ${shortDay(a.date)}`;
    case "correction": {
      const parts = [a.clockIn && `in ${a.clockIn}`, a.clockOut && `out ${a.clockOut}`].filter(Boolean);
      return `${shortDay(a.date)} · ${parts.join(", ")}`;
    }
    case "parts":
    case "equipment":
      return [
        `${a.quantity ?? 1} × ${a.item}`,
        money && `est. ${money}`,
        a.reference,
        `needed by ${shortDay(a.date)}`,
      ]
        .filter(Boolean)
        .join(" · ");
    case "expense":
      return [a.item, money, a.category, `spent ${shortDay(a.date)}`].filter(Boolean).join(" · ");
    case "travel":
      return [`To ${a.destination}`, range(a), money && `est. ${money}`].filter(Boolean).join(" · ");
  }
}

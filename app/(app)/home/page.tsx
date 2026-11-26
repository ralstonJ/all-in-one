import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { canSeeBusinessDashboards, requireUser } from "@/lib/auth";
import { COMPANY } from "@/lib/data/people";
import {
  ATTENDANCE_PERIOD,
  ATTENDANCE_TARGET,
  formatRate,
  getDepartmentAttendance,
  getOverallAttendance,
} from "@/lib/attendance";
import { LABOUR_MONTHS, getLabourSummary } from "@/lib/labour";
import { PARTS_MONTHS, formatMoney, getPartsSummary } from "@/lib/parts";
import { getTasksFor } from "@/lib/tasks";
import { TaskCalendar } from "@/components/task-calendar";

export const metadata: Metadata = { title: "Home" };

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function HomePage() {
  const user = await requireUser();
  const showDashboards = canSeeBusinessDashboards(user);
  const tasks = user.person ? getTasksFor(user.person.id) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {greeting()}, {user.displayName.split(" ")[0]}
        </h1>
        <p className="text-sm text-slate-500">{COMPANY.name}</p>
      </div>

      {showDashboards && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AttendanceCard />
          <LabourCard />
          <PartsCard />
        </div>
      )}

      {tasks.length > 0 && (
        <section aria-labelledby="home-calendar" className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 id="home-calendar" className="text-lg font-semibold text-slate-900">
              Your calendar
            </h2>
            <Link href="/calendar" className="text-sm font-medium text-blue-600 hover:underline">
              Open Calendar
            </Link>
          </div>
          <TaskCalendar tasks={tasks} />
        </section>
      )}
    </div>
  );
}

function AttendanceCard() {
  const overall = getOverallAttendance();
  const belowTarget = getDepartmentAttendance().filter(
    (d) => d.rate < ATTENDANCE_TARGET,
  );

  return (
    <Link
      href="/attendance"
      className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Attendance
        </h2>
        <span className="text-xs text-slate-400">{ATTENDANCE_PERIOD.label}</span>
      </div>
      <p className="mt-3 text-4xl font-semibold tabular-nums text-slate-900">
        {formatRate(overall.rate)}
      </p>
      <p className="mt-1 text-sm text-slate-500">
        Overall · {overall.absences} days absent of {overall.scheduled} scheduled
      </p>

      {belowTarget.length > 0 ? (
        <div className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <p className="font-medium">
            {belowTarget.length} {belowTarget.length === 1 ? "department" : "departments"} below{" "}
            {ATTENDANCE_TARGET}%
          </p>
          <p className="text-amber-800">
            {belowTarget.map((d) => `${d.department} ${formatRate(d.rate)}`).join(" · ")}
          </p>
        </div>
      ) : (
        <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Every department is at or above {ATTENDANCE_TARGET}%.
        </p>
      )}

      <p className="mt-4 flex items-center gap-1 text-sm font-medium text-blue-600">
        See by department
        <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
      </p>
    </Link>
  );
}

function LabourCard() {
  const summary = getLabourSummary();
  const max = 100;

  return (
    <Link
      href="/labour"
      className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Labour usage
        </h2>
        <span className="text-xs text-slate-400">
          Jan–{summary.current.month} {summary.year}
        </span>
      </div>
      <p className="mt-3 text-4xl font-semibold tabular-nums text-slate-900">
        {Math.round(summary.average)}%
      </p>
      <p className="mt-1 text-sm text-slate-500">
        Of available hours booked to jobs · {summary.headcount} productive staff
      </p>

      {/* Monthly average, one bar per month */}
      <div
        className="mt-4 flex h-14 items-end gap-0.5"
        role="img"
        aria-label={`Monthly labour usage: ${summary.monthly
          .map((v, i) => `${LABOUR_MONTHS[i]} ${Math.round(v)}%`)
          .join(", ")}`}
      >
        {summary.monthly.map((v, i) => {
          const isCurrent = i === summary.monthly.length - 1;
          return (
            <span key={LABOUR_MONTHS[i]} className="flex h-full flex-1 flex-col justify-end" title={`${LABOUR_MONTHS[i]}: ${Math.round(v)}%`}>
              <span
                className={`block rounded-t ${isCurrent ? "bg-[#1c5cab]" : "bg-[#86b6ef]"}`}
                style={{ height: `${(v / max) * 100}%` }}
              />
            </span>
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-400">
        <span>{LABOUR_MONTHS[0]}</span>
        <span>{summary.current.month}</span>
      </div>

      <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
        <p>
          <span className="font-medium">{summary.current.month}:</span> {Math.round(summary.current.value)}%
          {" · "}busiest trade {summary.busiestTradeNow.trade} at{" "}
          {Math.round(summary.busiestTradeNow.value)}%
        </p>
      </div>

      <p className="mt-4 flex items-center gap-1 text-sm font-medium text-blue-600">
        See who is busy through the year
        <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
      </p>
    </Link>
  );
}

function PartsCard() {
  const summary = getPartsSummary();
  const max = Math.max(...summary.monthly);
  const change = summary.changeVsPrevious;
  const top = summary.categories[0];

  return (
    <Link
      href="/parts-usage"
      className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Auto spare parts used
        </h2>
        <span className="text-xs text-slate-400">
          Jan–{summary.current.month} {summary.year}
        </span>
      </div>
      <p className="mt-3 text-4xl font-semibold tabular-nums text-slate-900">
        {formatMoney(summary.total, true)}
      </p>
      <p className="mt-1 text-sm text-slate-500">
        Worth of parts used on jobs, at cost
      </p>

      <div
        className="mt-4 flex h-14 items-end gap-0.5"
        role="img"
        aria-label={`Parts used per month: ${summary.monthly
          .map((v, i) => `${PARTS_MONTHS[i]} ${formatMoney(v, true)}`)
          .join(", ")}`}
      >
        {summary.monthly.map((v, i) => {
          const isCurrent = i === summary.monthly.length - 1;
          return (
            <span key={PARTS_MONTHS[i]} className="flex h-full flex-1 flex-col justify-end" title={`${PARTS_MONTHS[i]}: ${formatMoney(v)}`}>
              <span
                className={`block rounded-t ${isCurrent ? "bg-[#1c5cab]" : "bg-[#86b6ef]"}`}
                style={{ height: `${(v / max) * 100}%` }}
              />
            </span>
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-400">
        <span>{PARTS_MONTHS[0]}</span>
        <span>{summary.current.month}</span>
      </div>

      <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
        <p>
          <span className="font-medium">{summary.current.month}:</span>{" "}
          {formatMoney(summary.current.value, true)}, {change >= 0 ? "up" : "down"}{" "}
          {Math.abs(Math.round(change * 100))}% on {summary.previous.month}
        </p>
        <p className="text-slate-500">
          Biggest spend: {top.category} ({Math.round(top.share * 100)}%)
        </p>
      </div>

      <p className="mt-4 flex items-center gap-1 text-sm font-medium text-blue-600">
        See where the parts spend goes
        <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
      </p>
    </Link>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { requireBusinessViewer } from "@/lib/auth";
import { departmentStyle } from "@/lib/org";
import { Avatar } from "@/components/avatar";
import {
  ATTENDANCE_PERIOD,
  ATTENDANCE_TARGET,
  formatRate,
  getDepartmentAttendance,
  getOverallAttendance,
} from "@/lib/attendance";

export const metadata: Metadata = { title: "Attendance" };

function rateColour(rate: number) {
  if (rate < 93) return { bar: "bg-rose-500", text: "text-rose-700" };
  if (rate < ATTENDANCE_TARGET) return { bar: "bg-amber-500", text: "text-amber-700" };
  return { bar: "bg-emerald-500", text: "text-emerald-700" };
}

export default async function AttendancePage() {
  await requireBusinessViewer();
  const overall = getOverallAttendance();
  const departments = getDepartmentAttendance();
  const below = departments.filter((d) => d.rate < ATTENDANCE_TARGET);
  const sick = departments.reduce((s, d) => s + d.sick, 0);
  const unplanned = departments.reduce((s, d) => s + d.unplanned, 0);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/home"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Home
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Attendance</h1>
        <p className="text-sm text-slate-500">
          {ATTENDANCE_PERIOD.label} · {ATTENDANCE_PERIOD.workingDays} working days · target{" "}
          {ATTENDANCE_TARGET}%
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Overall" value={formatRate(overall.rate)} />
        <Stat label="Days absent" value={String(overall.absences)} />
        <Stat label="Sick days" value={String(sick)} />
        <Stat label="Unplanned leave" value={String(unplanned)} />
      </dl>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-medium text-slate-900">By department</h2>
          <p className="text-xs text-slate-500">
            Lowest first.{" "}
            {below.length
              ? `${below.map((d) => d.department).join(" and ")} ${below.length === 1 ? "is" : "are"} below target.`
              : "Every department is on target."}{" "}
            Click a department to see its people.
          </p>
        </div>

        <ul className="divide-y divide-slate-100">
          {departments.map((d) => {
            const colour = rateColour(d.rate);
            const style = departmentStyle(d.department);
            const isBelow = d.rate < ATTENDANCE_TARGET;
            return (
              <li key={d.department}>
                <details className="group" open={isBelow}>
                  <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-3 hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
                    <ChevronDown
                      className="h-4 w-4 shrink-0 -rotate-90 text-slate-400 transition group-open:rotate-0"
                      aria-hidden
                    />
                    <span className="flex w-44 shrink-0 items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} aria-hidden />
                      <span className="truncate font-medium text-slate-900">{d.department}</span>
                    </span>
                    <span className="relative hidden h-2 flex-1 overflow-hidden rounded-full bg-slate-100 sm:block">
                      <span
                        className={`absolute inset-y-0 left-0 rounded-full ${colour.bar}`}
                        style={{ width: `${d.rate}%` }}
                      />
                      <span
                        className="absolute inset-y-0 w-0.5 bg-slate-500"
                        style={{ left: `${ATTENDANCE_TARGET}%` }}
                        title={`Target ${ATTENDANCE_TARGET}%`}
                      />
                    </span>
                    <span className={`w-14 text-right font-semibold tabular-nums ${colour.text}`}>
                      {formatRate(d.rate)}
                    </span>
                    <span className="hidden w-36 text-right text-xs text-slate-500 md:inline">
                      {d.scheduled - d.present} absent · {d.headcount} people
                    </span>
                    {isBelow && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                        Below target
                      </span>
                    )}
                  </summary>

                  <div className="overflow-x-auto px-5 pb-4">
                    <table className="min-w-full text-sm">
                      <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th scope="col" className="py-2 pr-4 font-semibold">Person</th>
                          <th scope="col" className="py-2 pr-4 text-right font-semibold">Present</th>
                          <th scope="col" className="py-2 pr-4 text-right font-semibold">Sick</th>
                          <th scope="col" className="py-2 pr-4 text-right font-semibold">Unplanned</th>
                          <th scope="col" className="py-2 pr-4 text-right font-semibold">Late</th>
                          <th scope="col" className="py-2 text-right font-semibold">Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {d.people.map((p) => (
                          <tr key={p.person.id}>
                            <td className="py-2 pr-4">
                              <Link
                                href={`/people/${p.person.id}`}
                                className="flex items-center gap-3 hover:underline"
                              >
                                <Avatar name={p.person.name} size="sm" className={style.avatar} />
                                <span>
                                  <span className="block font-medium text-slate-900">{p.person.name}</span>
                                  <span className="block text-xs text-slate-500">{p.person.title}</span>
                                </span>
                              </Link>
                            </td>
                            <td className="py-2 pr-4 text-right tabular-nums text-slate-700">
                              {p.present}/{p.scheduled}
                            </td>
                            <Num value={p.sick} />
                            <Num value={p.unplanned} />
                            <Num value={p.late} />
                            <td className={`py-2 text-right font-medium tabular-nums ${rateColour(p.rate).text}`}>
                              {formatRate(p.rate)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Num({ value }: { value: number }) {
  return (
    <td className="py-2 pr-4 text-right tabular-nums text-slate-700">
      {value || <span className="text-slate-300">0</span>}
    </td>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{value}</dd>
    </div>
  );
}

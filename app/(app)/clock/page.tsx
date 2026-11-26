import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getManager } from "@/lib/org";
import { clockAction } from "@/app/actions/time";
import {
  addDays,
  dateKey,
  fromKey,
  getClockStatus,
  getSessions,
  weekStart,
  workedMinutes,
} from "@/lib/time-store";
import { LiveClock } from "@/components/live-clock";
import { ClockButton } from "@/components/clock-button";
import { RequestForm } from "@/components/request-form";

export const metadata: Metadata = { title: "Clock In/Out" };

const time = (d: Date) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
const hm = (minutes: number) => `${Math.floor(minutes / 60)}h ${String(Math.round(minutes % 60)).padStart(2, "0")}m`;

export default async function ClockPage() {
  const user = await requireUser();

  if (!user.person) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Clock In/Out</h1>
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
          The <span className="font-mono">{user.username}</span> account isn&apos;t linked to anyone on the
          org chart, so it has no timesheet. Sign in as a staff member to clock in, or review requests in{" "}
          <Link href="/approvals" className="font-medium text-blue-600 hover:underline">Approvals</Link>.
        </p>
      </div>
    );
  }

  const person = user.person;
  const manager = getManager(person);
  const status = getClockStatus(person.id);
  const today = dateKey(new Date());
  const todaySessions = getSessions(person.id, today);
  const monday = weekStart(today);
  const week = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(monday, i);
    const sessions = getSessions(person.id, day);
    return { day, sessions, minutes: workedMinutes(sessions) };
  });
  const weekTotal = week.reduce((s, d) => s + d.minutes, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Clock In/Out</h1>
        <p className="text-sm text-slate-500">
          {person.name} · {person.title}
          {person.team ? ` · ${person.team}` : ""}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <LiveClock since={status.clockedIn && status.since ? status.since.toISOString() : null} />
              <div className="text-right">
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
                    status.clockedIn ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${status.clockedIn ? "bg-emerald-500" : "bg-slate-400"}`}
                    aria-hidden
                  />
                  {status.clockedIn ? "Clocked in" : "Clocked out"}
                </span>
                {status.since && (
                  <p className="mt-2 text-xs text-slate-500">
                    {status.clockedIn ? "Since" : "Last clocked out"}{" "}
                    {dateKey(status.since) === today
                      ? time(status.since)
                      : status.since.toLocaleString("en-GB", { weekday: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
              </div>
            </div>

            <form action={clockAction} className="mt-6">
              <input type="hidden" name="type" value={status.clockedIn ? "out" : "in"} />
<ClockButton clockedIn={status.clockedIn} />
            </form>

            <div className="mt-6 border-t border-slate-100 pt-4">
              <div className="flex items-baseline justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Today</h2>
                <span className="text-sm font-medium tabular-nums text-slate-900">
                  {hm(workedMinutes(todaySessions))}
                </span>
              </div>
              {todaySessions.length ? (
                <ul className="mt-2 space-y-1 text-sm">
                  {todaySessions.map((s, i) => (
                    <li key={i} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 tabular-nums">
                      <span>
                        {time(s.in)} – {s.out ? time(s.out) : <span className="text-emerald-700">now</span>}
                      </span>
                      <span className="text-slate-500">{hm(workedMinutes([s]))}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">No clock-ins yet today.</p>
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-baseline justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="font-medium text-slate-900">This week</h2>
              <span className="text-sm tabular-nums text-slate-600">
                Total <span className="font-semibold text-slate-900">{hm(weekTotal)}</span>
              </span>
            </div>
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-2.5">Day</th>
                  <th scope="col" className="px-5 py-2.5">First in</th>
                  <th scope="col" className="px-5 py-2.5">Last out</th>
                  <th scope="col" className="px-5 py-2.5 text-right">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {week.map(({ day, sessions, minutes }) => {
                  const isToday = day === today;
                  const last = sessions[sessions.length - 1];
                  return (
                    <tr key={day} className={isToday ? "bg-blue-50/60" : day > today ? "text-slate-400" : ""}>
                      <td className="px-5 py-2.5">
                        {fromKey(day).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                        {isToday && <span className="ml-2 text-xs font-medium text-blue-700">Today</span>}
                      </td>
                      <td className="px-5 py-2.5 tabular-nums">{sessions[0] ? time(sessions[0].in) : "—"}</td>
                      <td className="px-5 py-2.5 tabular-nums">
                        {last ? (last.out ? time(last.out) : isToday ? "On the clock" : "Missing") : "—"}
                      </td>
                      <td className="px-5 py-2.5 text-right tabular-nums">{minutes ? hm(minutes) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-medium text-slate-900">Make a request</h2>
            <p className="mb-4 text-xs text-slate-500">
              Fix a missed clock-in or clock-out, claim overtime, or ask for leave.
            </p>
            {manager ? (
              <RequestForm types={["correction", "overtime", "leave"]} today={today} managerName={manager.name} />
            ) : (
              <p className="text-sm text-slate-500">
                You&apos;re at the top of the chart, so there is no one to send requests to.
              </p>
            )}
          </section>
          <Link
            href="/approvals"
            className="block rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-blue-600 shadow-sm hover:bg-slate-50"
          >
            See my requests in Approvals →
          </Link>
        </aside>
      </div>
    </div>
  );
}

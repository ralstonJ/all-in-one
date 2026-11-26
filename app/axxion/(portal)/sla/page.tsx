import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, Bell, Clock, Info, Timer } from "lucide-react";
import { requireAxUser } from "@/lib/axxion/session";
import {
  SLA_ACTORS,
  SLA_ACTOR_ORDER,
  SLA_CLOCKS,
  SLA_NOTES,
  type SlaActor,
  type SlaClock,
} from "@/lib/axxion/sla-catalogue";

export const metadata: Metadata = { title: { absolute: "SLA clocks · Axxion Claims" } };

const card = "rounded-2xl border border-slate-200 bg-white shadow-sm";

export default async function SlaPage({ searchParams }: { searchParams: Promise<{ actor?: string }> }) {
  const user = await requireAxUser();
  // Mirrors the staff app, where the SLA page is super-user only.
  if (user.role !== "admin") notFound();

  const { actor } = await searchParams;
  const selected = actor && actor in SLA_ACTORS ? (actor as SlaActor) : undefined;
  const actors = selected ? [selected] : SLA_ACTOR_ORDER;
  const timed = SLA_CLOCKS.filter((c) => c.breachHours !== undefined);
  const fastest = [...timed].sort((a, b) => a.breachHours! - b.breachHours!)[0];
  const under1h = timed.filter((c) => c.breachHours! <= 1).length;

  const chip = (active: boolean) =>
    `rounded-full px-3 py-1 text-xs font-medium transition ${active ? "bg-[#0b1f3a] text-white" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"}`;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/axxion/home" className="text-sm text-slate-500 hover:text-slate-800">← Home</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">SLA clocks</h1>
        <p className="text-sm text-slate-500">
          Every deadline in the claim process, who it applies to, when reminders go out and where a breach escalates.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Summary icon={<Timer className="h-4 w-4" aria-hidden />} label="SLA clocks" value={String(SLA_CLOCKS.length)} sub={`across ${SLA_ACTOR_ORDER.length} actors`} />
        <Summary icon={<Clock className="h-4 w-4" aria-hidden />} label="Working time" value="Mon–Sat" sub="09:00–18:00 Dubai" />
        <Summary icon={<AlertTriangle className="h-4 w-4" aria-hidden />} label="Breach within 1 h" value={String(under1h)} sub={`fastest: ${fastest.breachLabel}`} />
        <Summary icon={<Info className="h-4 w-4" aria-hidden />} label="Not active yet" value={String(SLA_CLOCKS.filter((c) => c.status === "inactive").length)} sub="total-loss decision" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link href="/axxion/sla" className={chip(!selected)}>
          All ({SLA_CLOCKS.length})
        </Link>
        {SLA_ACTOR_ORDER.map((a) => (
          <Link key={a} href={`/axxion/sla?actor=${a}`} className={chip(selected === a)}>
            {SLA_ACTORS[a].label} ({SLA_CLOCKS.filter((c) => c.actor === a).length})
          </Link>
        ))}
      </div>

      <p className="flex items-center gap-2 text-xs text-slate-500">
        <span className="inline-block h-2 w-8 rounded-full bg-slate-200" aria-hidden /> time until breach
        <span className="ml-3 inline-block h-3 w-1 rounded bg-amber-500" aria-hidden /> reminder
        <span className="ml-3 inline-block h-3 w-1 rounded bg-rose-600" aria-hidden /> breach and escalation
      </p>

      {actors.map((a) => {
        const clocks = SLA_CLOCKS.filter((c) => c.actor === a);
        return (
          <section key={a} className={card}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="font-semibold text-slate-900">
                  {SLA_ACTORS[a].label} <span className="font-normal text-slate-500">· {clocks.length} clocks</span>
                </h2>
                <p className="text-xs text-slate-500">Deadlines that {SLA_ACTORS[a].who.toLowerCase()} are responsible for</p>
              </div>
              <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-rose-700">
                Breaches go to {SLA_ACTORS[a].escalation}
              </span>
            </div>
            <ul className="divide-y divide-slate-100">
              {clocks.map((c) => (
                <ClockRow key={c.title} clock={c} />
              ))}
            </ul>
          </section>
        );
      })}

      <section>
        <h2 className="mb-3 font-semibold text-slate-900">Things to know</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {SLA_NOTES.map((n) => (
            <div
              key={n.title}
              className={`rounded-xl border px-4 py-3 text-sm ${
                n.tone === "warn"
                  ? "border-amber-200 bg-amber-50 text-amber-900"
                  : n.tone === "planned"
                    ? "border-indigo-200 bg-indigo-50 text-indigo-900"
                    : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              <p className="font-semibold">{n.title}</p>
              <p className="mt-0.5">{n.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Summary({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className={`${card} px-4 py-3`}>
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
        {icon} {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{sub}</p>
    </div>
  );
}

function ClockRow({ clock: c }: { clock: SlaClock }) {
  const fast = c.breachHours !== undefined && c.breachHours <= 1;
  return (
    <li className={`grid gap-3 px-5 py-4 md:grid-cols-[1fr_16rem] md:items-center ${c.status === "inactive" ? "opacity-70" : ""}`}>
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-900">
          {c.title}
          {fast && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">Within 1 h</span>}
          {c.status === "inactive" && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">Never fires yet</span>
          )}
        </p>
        <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
          <span>
            <span className="text-slate-500">Breach after</span> <span className="font-semibold text-slate-900">{c.breachLabel}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Bell className="h-3.5 w-3.5 text-amber-600" aria-hidden />
            <span className="text-slate-500">Reminder</span> <span className="font-medium text-slate-800">{c.reminderLabel}</span>
            <span className="text-slate-500">to {c.remind.toLowerCase()}</span>
          </span>
        </p>
        {c.note && <p className="mt-1 text-xs text-slate-500">{c.note}</p>}
      </div>
      <ClockBar clock={c} />
    </li>
  );
}

/** Track from clock start to breach, with a tick at each reminder. */
function ClockBar({ clock: c }: { clock: SlaClock }) {
  if (c.breachHours === undefined || !c.reminderHours) {
    return <p className="text-xs text-slate-500 md:text-right">Deadline set per case</p>;
  }
  const total = c.breachHours;
  const fmt = (x: number) => (x < 1 ? `${Math.round(x * 60)}m` : `${x}h`);
  return (
    <div aria-label={`Reminder at ${c.reminderLabel}, breach at ${c.breachLabel}`} role="img">
      <div className="relative h-2 rounded-full bg-slate-200">
        {c.reminderHours.map((r) => (
          <span
            key={r}
            title={`Reminder at ${fmt(r)}`}
            className="absolute -top-1 h-4 w-1 -translate-x-1/2 rounded bg-amber-500"
            style={{ left: `${(r / total) * 100}%` }}
          />
        ))}
        <span title={`Breach at ${fmt(total)}`} className="absolute -top-1 right-0 h-4 w-1 rounded bg-rose-600" />
      </div>
      <div className="relative mt-1 h-4 text-[10px] text-slate-500">
        {Math.min(...c.reminderHours) / total > 0.15 && <span className="absolute left-0">start</span>}
        {c.reminderHours.map((r) => (
          <span key={r} className="absolute -translate-x-1/2 text-amber-700" style={{ left: `${(r / total) * 100}%` }}>
            {fmt(r)}
          </span>
        ))}
        <span className="absolute right-0 font-semibold text-rose-700">{fmt(total)}</span>
      </div>
    </div>
  );
}

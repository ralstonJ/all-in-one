import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { accountsByRole, getAxAccount, type AxAccount } from "@/lib/axxion/accounts";
import type { AxStore } from "@/lib/axxion/types";
import { SLA_ACTOR_ORDER, SLA_CLOCKS, type SlaActor } from "@/lib/axxion/sla-catalogue";
import {
  PERSONAS,
  RANGE_DAYS,
  SLA_ACTORS,
  STAGE,
  STAGE_ORDER,
  blockersFor,
  canRemind,
  clockFor,
  formatWorking,
  isOpen,
  metrics,
  timing,
  versusUsual,
  type Range,
} from "@/lib/axxion/workflow";
import { currentWorkdayEnd, dubaiTime, sameDubaiDay, workingBetween } from "@/lib/axxion/working-time";
import { RemindAll } from "@/components/axxion/remind-all";
import { BlockerRow, card } from "@/components/axxion/ui";
import { RangeTabs } from "@/components/axxion/metrics";

export type AdminTab = "overview" | "blockers" | "team" | "pipeline";
const TABS: { id: AdminTab; label: string; question: string }[] = [
  { id: "overview", label: "Overview", question: "How are we doing today?" },
  { id: "blockers", label: "Blockers", question: "Which SLAs are breached, and who owns them?" },
  { id: "team", label: "Team", question: "How much work did each person do?" },
  { id: "pipeline", label: "Pipeline", question: "Where are all the open claims?" },
];

const BAR = "#3987e5";

/** Steps described by area of work, not by the people doing them. */
const STEP_AREA: Record<SlaActor, string> = {
  handler: "claims-handling steps",
  surveyor: "survey and quality-check steps",
  head: "approval steps",
  insurer: "insurer steps (LPO)",
  workshop: "garage steps",
};
const AREA_LABEL: Record<SlaActor, string> = {
  handler: "Claims handling",
  surveyor: "Survey & quality check",
  head: "Approvals",
  insurer: "Insurer (LPO)",
  workshop: "Garage",
};
const PERSONA_LABEL = { handler: "Claims handlers", surveyor: "Surveyors", head: "Heads of Claims" } as const;
type Persona = keyof typeof PERSONA_LABEL;

function href(params: Record<string, string | undefined>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
  const s = q.toString();
  return `/axxion/home${s ? `?${s}` : ""}`;
}

export function AdminTabs({ tab, blockers }: { tab: AdminTab; blockers: number }) {
  const active = TABS.find((t) => t.id === tab)!;
  return (
    <div className="space-y-2">
      <nav aria-label="Admin sections" className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={href({ tab: t.id === "overview" ? undefined : t.id })}
            aria-current={t.id === tab ? "page" : undefined}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              t.id === tab ? "bg-[#0b1f3a] text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t.label}
            {t.id === "blockers" && blockers > 0 && (
              <span className={`rounded-full px-1.5 text-xs ${t.id === tab ? "bg-white/20" : "bg-rose-100 text-rose-700"}`}>{blockers}</span>
            )}
          </Link>
        ))}
      </nav>
      <p className="text-sm text-slate-500">{active.question}</p>
    </div>
  );
}

function Delta({ now, usual }: { now: number; usual: number }) {
  if (usual < 1) return <span className="text-xs text-slate-500">no history yet</span>;
  const pct = Math.round(((now - usual) / usual) * 100);
  if (Math.abs(pct) < 8)
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
        <ArrowRight className="h-3.5 w-3.5" aria-hidden /> about usual ({Math.round(usual)})
      </span>
    );
  const up = pct > 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${up ? "text-emerald-700" : "text-amber-800"}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden /> {Math.abs(pct)}% {up ? "above" : "below"} usual ({Math.round(usual)})
    </span>
  );
}

function BarList({ rows, max }: { rows: { key: string; label: React.ReactNode; value: number; href?: string; note?: string }[]; max?: number }) {
  const top = max ?? Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => {
        const body = (
          <>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate text-slate-800">{r.label}</span>
              <span className="shrink-0 font-semibold tabular-nums text-slate-900">
                {r.value}
                {r.note && <span className="ml-1.5 text-xs font-normal text-slate-500">{r.note}</span>}
              </span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full" style={{ width: `${(r.value / top) * 100}%`, backgroundColor: BAR }} />
            </div>
          </>
        );
        return (
          <li key={r.key}>
            {r.href ? (
              <Link href={r.href} className="-mx-2 block rounded-lg px-2 py-1 hover:bg-slate-50">
                {body}
              </Link>
            ) : (
              <div className="py-1">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ─── Overview ──────────────────────────────────────────────────────────── */

export function AdminOverview({ user, store, now }: { user: AxAccount; store: AxStore; now: Date }) {
  const blockers = blockersFor(user, store.claims, now);
  const open = store.claims.filter(isOpen);
  const dueToday = open.filter((c) => timing(c, now) === "today").length;
  const dayEnd = currentWorkdayEnd(now);
  const dayLabel = sameDubaiDay(dayEnd, now) ? "today" : `by ${dubaiTime(dayEnd, { day: undefined, month: undefined, hour: undefined, minute: undefined })} 18:00`;
  const vs = versusUsual(store.activity, "day", now);
  const byActor = SLA_ACTOR_ORDER.map((a) => ({ a, n: blockers.filter((b) => b.actor === a).length }))
    .filter((x) => x.n > 0)
    .sort((x, y) => y.n - x.n);
  const worst = byActor[0];
  const byClock = new Map<string, number>();
  for (const b of blockers) byClock.set(b.clock.title, (byClock.get(b.clock.title) ?? 0) + 1);
  const topClocks = [...byClock.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const pctUsual = vs.all.usual ? Math.round(((vs.all.now - vs.all.usual) / vs.all.usual) * 100) : 0;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-[#0b1f3a] p-6 text-white shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-200">Today in one line</p>
        <p className="mt-2 text-xl font-medium leading-snug">
          The team has completed {vs.all.now} jobs so far today,{" "}
          {Math.abs(pctUsual) < 8 ? "in line with a usual working day" : `${Math.abs(pctUsual)}% ${pctUsual > 0 ? "above" : "below"} the usual pace for this time`}.{" "}
          {blockers.length ? (
            <>
              {blockers.length} claims are past their SLA and have been escalated for follow-up
              {worst && <>, with the largest share at {STEP_AREA[worst.a]} ({worst.n})</>}.{" "}
            </>
          ) : (
            "Every claim is within its SLA. "
          )}
          {dueToday} more are due {dayLabel}.
        </p>
        {blockers.length > 0 && (
          <Link href={href({ tab: "blockers" })} className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-[#0b1f3a] hover:bg-sky-50">
            Review claims past SLA <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <div className={`${card} p-5`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Past SLA</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-slate-900">{blockers.length}</p>
          <p className="text-sm text-slate-500">of {open.length} open claims · escalated for follow-up</p>
        </div>
        <div className={`${card} p-5`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Due {sameDubaiDay(dayEnd, now) ? "by 18:00 today" : `by ${dubaiTime(dayEnd, { day: undefined, month: undefined, hour: undefined, minute: undefined })} 18:00`}
          </p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-amber-800">{dueToday}</p>
          <p className="text-sm text-slate-500">{sameDubaiDay(dayEnd, now) ? "will breach if not done today" : "working day is over; these are due next working day"}</p>
        </div>
        <div className={`${card} p-5`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Jobs done today</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-slate-900">{vs.all.now}</p>
          <Delta now={vs.all.now} usual={vs.all.usual} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={`${card} p-5`}>
          <h2 className="font-semibold text-slate-900">Where follow-up is needed</h2>
          <p className="mb-4 text-xs text-slate-500">Claims past SLA by area of work, and the group they escalated to. Click a row to see the claims.</p>
          {byActor.length ? (
            <BarList
              rows={byActor.map(({ a, n }) => ({
                key: a,
                label: (
                  <>
                    {AREA_LABEL[a]} <span className="text-xs text-slate-500">· {SLA_ACTORS[a].escalation}</span>
                  </>
                ),
                value: n,
                href: href({ tab: "blockers", actor: a }),
              }))}
            />
          ) : (
            <p className="text-sm text-slate-500">Nothing is breached.</p>
          )}
        </section>

        <section className={`${card} p-5`}>
          <h2 className="font-semibold text-slate-900">Most-breached SLAs</h2>
          <p className="mb-4 text-xs text-slate-500">The clocks breaching most often right now.</p>
          {topClocks.length ? (
            <BarList
              rows={topClocks.map(([title, n]) => {
                const clock = SLA_CLOCKS.find((c) => c.title === title)!;
                return {
                  key: title,
                  label: (
                    <>
                      {title} <span className="text-xs text-slate-500">· {clock.breachLabel}</span>
                    </>
                  ),
                  value: n,
                  href: href({ tab: "blockers", actor: clock.actor, clock: title }),
                };
              })}
            />
          ) : (
            <p className="text-sm text-slate-500">Nothing is breached.</p>
          )}
        </section>
      </div>

      <section className={`${card} p-5`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold text-slate-900">Jobs done today, by team</h2>
          <Link href={href({ tab: "team" })} className="text-sm font-medium text-blue-600 hover:underline">
            See each person
          </Link>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {PERSONAS.map((p) => (
            <div key={p} className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-sm text-slate-600">{PERSONA_LABEL[p as Persona]}</p>
              <p className="text-2xl font-semibold tabular-nums text-slate-900">{vs[p].now}</p>
              <Delta now={vs[p].now} usual={vs[p].usual} />
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">&ldquo;Usual&rdquo; is the average by this time of day over the last 20 working days (Mon–Sat).</p>
      </section>
    </div>
  );
}

/* ─── Blockers ──────────────────────────────────────────────────────────── */

export function AdminBlockers({ user, store, now, actor, clock }: { user: AxAccount; store: AxStore; now: Date; actor?: SlaActor; clock?: string }) {
  const all = blockersFor(user, store.claims, now);
  const countFor = (a: SlaActor) => all.filter((b) => b.actor === a).length;
  // No tab picked: open the first group that has breaches.
  const active = actor ?? SLA_ACTOR_ORDER.find((a) => countFor(a) > 0) ?? SLA_ACTOR_ORDER[0];
  const inActor = all.filter((b) => b.actor === active);
  const items = clock ? inActor.filter((b) => b.clock.title === clock) : inActor;
  const clockCounts = new Map<string, number>();
  for (const b of inActor) clockCounts.set(b.clock.title, (clockCounts.get(b.clock.title) ?? 0) + 1);
  const people = new Map<string, number>();
  for (const b of items) people.set(b.waiting.label, (people.get(b.waiting.label) ?? 0) + 1);
  const topPeople = [...people.entries()].sort((x, y) => y[1] - x[1]).slice(0, 8);
  const remindable = items.filter((b) => canRemind(user, b.claim)).map((b) => b.claim.id);

  const chip = (on: boolean) =>
    `rounded-full px-3 py-1 text-xs font-medium transition ${on ? "bg-[#0b1f3a] text-white" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"}`;

  return (
    <div className="space-y-4">
      <nav aria-label="Breaches by owner" className="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-slate-200">
        {SLA_ACTOR_ORDER.map((a) => {
          const n = countFor(a);
          const on = a === active;
          return (
            <Link
              key={a}
              href={href({ tab: "blockers", actor: a })}
              aria-current={on ? "page" : undefined}
              className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
                on ? "border-[#0b1f3a] text-slate-900" : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
              }`}
            >
              {SLA_ACTORS[a].label}
              <span className={`rounded-full px-1.5 text-xs tabular-nums ${n ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-500"}`}>{n}</span>
            </Link>
          );
        })}
      </nav>

      <section className={card}>
        <div className="space-y-3 border-b border-slate-100 px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-slate-900">
                {SLA_ACTORS[active].label} <span className="text-rose-700">· {items.length} breached</span>
              </h2>
              <p className="text-xs text-slate-500">
                Escalated automatically to {SLA_ACTORS[active].escalation}. Reminders before the breach were sent automatically too.{" "}
                <Link href="/axxion/sla" className="font-medium text-blue-600 hover:underline">See all SLA clocks</Link>
              </p>
            </div>
            {remindable.length > 1 && <RemindAll claimIds={remindable} />}
          </div>
          {clockCounts.size > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">SLA</span>
              <Link href={href({ tab: "blockers", actor: active })} className={chip(!clock)}>
                Any ({inActor.length})
              </Link>
              {[...clockCounts.entries()]
                .sort((x, y) => y[1] - x[1])
                .map(([title, n]) => (
                  <Link key={title} href={href({ tab: "blockers", actor: active, clock: title })} className={chip(clock === title)}>
                    {title} ({n})
                  </Link>
                ))}
            </div>
          )}
          {active !== "head" && topPeople.length > 1 && (
            <p className="flex flex-wrap gap-1.5 text-xs">
              {topPeople.map(([name, n]) => (
                <span key={name} className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
                  {name} <span className="font-semibold">{n}</span>
                </span>
              ))}
            </p>
          )}
        </div>
        {items.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">Nothing breached for {SLA_ACTORS[active].label.toLowerCase()} steps.</p>
        ) : (
          <ul className="divide-y divide-slate-100 px-5">
            {items.map((b) => (
              <BlockerRow key={b.claim.id} b={b} user={user} now={now} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ─── Team ──────────────────────────────────────────────────────────────── */

export function AdminTeam({ store, now, range }: { store: AxStore; now: Date; range: Range }) {
  const m = metrics(store.activity, range, now);
  const vs = versusUsual(store.activity, range, now);
  const period = range === "day" ? "today" : range === "week" ? "in the last 7 days" : "in the last 30 days";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          <span className="text-2xl font-semibold tabular-nums text-slate-900">{m.total.toLocaleString("en-GB")}</span> jobs done {period}{" "}
          <Delta now={vs.all.now} usual={vs.all.usual} />
        </p>
        <RangeTabs range={range} tab="team" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {PERSONAS.map((role) => {
          const r = role as Persona;
          const people = accountsByRole(role).map((p) => {
            const s = m.byPerson.get(p.id);
            const top = s ? [...s.actions.entries()].sort((a, b) => b[1] - a[1])[0] : undefined;
            return { p, count: s?.count ?? 0, top };
          });
          people.sort((a, b) => b.count - a.count);
          const avg = people.reduce((s, x) => s + x.count, 0) / Math.max(1, people.length);
          const series = m.days.map((d) => d.counts[r]);
          const maxDay = Math.max(1, ...series);
          const from = m.days.length - RANGE_DAYS[range];
          return (
            <section key={r} className={`${card} p-5`}>
              <h2 className="font-semibold text-slate-900">{PERSONA_LABEL[r]}</h2>
              <p className="text-sm text-slate-600">
                <span className="text-xl font-semibold tabular-nums text-slate-900">{m.byRole[r]}</span> jobs · <Delta now={vs[r].now} usual={vs[r].usual} />
              </p>
              <div className="mt-3 flex h-10 items-end gap-px" role="img" aria-label={`${PERSONA_LABEL[r]} jobs per day, last 30 days`}>
                {series.map((v, i) => (
                  <span
                    key={i}
                    title={`${m.days[i].label}: ${v}`}
                    className="block flex-1 rounded-t-sm"
                    style={{ height: `${(v / maxDay) * 100}%`, backgroundColor: i >= from ? "#1c5cab" : "#cde2fb" }}
                  />
                ))}
              </div>
              <p className="mt-1 text-[10px] text-slate-400">Last 30 days · darker = selected period · Sundays are off</p>
              <div className="mt-4">
                <BarList
                  rows={people.map(({ p, count, top }) => ({
                    key: p.id,
                    label: (
                      <>
                        {getAxAccount(p.id)?.name}
                        {count < avg * 0.6 && count > 0 && <span className="ml-1.5 rounded bg-amber-50 px-1 text-[10px] font-medium text-amber-800">low</span>}
                        {count === 0 && <span className="ml-1.5 rounded bg-slate-100 px-1 text-[10px] font-medium text-slate-600">none</span>}
                      </>
                    ),
                    value: count,
                    note: top ? top[0].toLowerCase() : undefined,
                  }))}
                />
              </div>
            </section>
          );
        })}
      </div>
      <p className="text-xs text-slate-500">&ldquo;Low&rdquo; marks anyone under 60% of their team&apos;s average for the period. The note shows each person&apos;s most common job.</p>
    </div>
  );
}

/* ─── Pipeline ──────────────────────────────────────────────────────────── */

const OWNER_TEXT: Record<string, string> = {
  handler: "claims handler",
  surveyor: "surveyor",
  head: "head of claims",
  insurer: "insurer",
  workshop: "garage",
  garages: "invited garages",
};

export function AdminPipeline({ store, now }: { store: AxStore; now: Date }) {
  const open = store.claims.filter(isOpen);
  const stages = STAGE_ORDER.map((s) => {
    const inStage = open.filter((c) => c.stage === s);
    const late = inStage.filter((c) => timing(c, now) === "breached").length;
    const avg = inStage.length ? inStage.reduce((sum, c) => sum + workingBetween(new Date(c.stageSince), now), 0) / inStage.length : 0;
    return { s, count: inStage.length, late, avg };
  });
  const max = Math.max(1, ...stages.map((x) => x.count));
  return (
    <section className={`${card} p-5`}>
      <h2 className="font-semibold text-slate-900">Open claims by step</h2>
      <p className="mb-4 text-xs text-slate-500">
        ClaimOS steps in order, each with its SLA. The red number is how many in that step have breached.
      </p>
      <ol className="space-y-3">
        {stages.map((x, i) => {
          const clock = clockFor(x.s);
          return (
            <li key={x.s} className="grid grid-cols-[1.5rem_1fr] gap-3">
              <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">{i + 1}</span>
              <div>
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium text-slate-900">
                    {STAGE[x.s].label}{" "}
                    <span className="text-xs font-normal text-slate-500">
                      · {OWNER_TEXT[STAGE[x.s].owner ?? ""] ?? ""} · SLA {clock?.breachLabel}
                      {x.count ? ` · in this step ${formatWorking(x.avg)} on average` : ""}
                    </span>
                  </span>
                  <span className="tabular-nums">
                    <span className="font-semibold text-slate-900">{x.count}</span>
                    {x.late > 0 && <span className="ml-2 text-xs font-medium text-rose-700">{x.late} breached</span>}
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full" style={{ width: `${(x.count / max) * 100}%`, backgroundColor: BAR }} />
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

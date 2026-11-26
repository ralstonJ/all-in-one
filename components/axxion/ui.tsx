import Link from "next/link";
import { AlertTriangle, Bell, Clock } from "lucide-react";
import type { AxAccount } from "@/lib/axxion/accounts";
import type { Claim } from "@/lib/axxion/types";
import {
  STAGE,
  canRemind,
  formatWorking,
  slaStatus,
  type BlockerItem,
  type InboxItem,
  type Timing,
} from "@/lib/axxion/workflow";
import { dubaiTime, sameDubaiDay } from "@/lib/axxion/working-time";
import { ActionForm } from "@/components/axxion/action-form";

export const card = "rounded-2xl border border-slate-200 bg-white shadow-sm";

export function fmt(iso: string) {
  return dubaiTime(iso);
}

export function money(n: number) {
  return `AED ${Math.round(n).toLocaleString("en-AE")}`;
}

/** Deadline status in working time. */
export function TimingBadge({ claim, timing, now }: { claim: Claim; timing: Timing; now: Date }) {
  const s = slaStatus(claim, now);
  if (timing === "breached")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
        <AlertTriangle className="h-3 w-3" aria-hidden /> Breached {formatWorking(s.lateBy)} ago
      </span>
    );
  if (timing === "today")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
        <Clock className="h-3 w-3" aria-hidden />{" "}
        {sameDubaiDay(new Date(claim.dueAt), now)
          ? `Due today ${dubaiTime(claim.dueAt, { weekday: undefined, day: undefined, month: undefined })}`
          : `Due ${dubaiTime(claim.dueAt, { day: undefined, month: undefined })} (next working day)`}
      </span>
    );
  return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">Due {fmt(claim.dueAt)}</span>;
}

export function StageBadge({ claim }: { claim: Claim }) {
  return <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">{STAGE[claim.stage].label}</span>;
}

/** Automatic SLA state: reminders sent, and the escalation group once breached. */
export function SlaChips({ claim, now }: { claim: Claim; now: Date }) {
  const s = slaStatus(claim, now);
  return (
    <>
      {s.breached && s.escalation && (
        <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white">Escalated to {s.escalation}</span>
      )}
      {!s.breached && s.remindersSent > 0 && (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
          <Bell className="h-3 w-3" aria-hidden /> {s.remindersSent} auto-reminder{s.remindersSent === 1 ? "" : "s"} sent
        </span>
      )}
    </>
  );
}

export function ClaimLine({ claim }: { claim: Claim }) {
  return (
    <>
      <Link href={`/axxion/claims/${claim.id}`} className="font-semibold text-slate-900 hover:underline">
        {claim.id}
      </Link>
      <span className="text-slate-500">
        {" · "}
        {claim.vehicle.year} {claim.vehicle.make} {claim.vehicle.model} · {claim.insured} · {claim.insurer}
      </span>
    </>
  );
}

export function Stat({ label, value, tone = "slate" }: { label: string; value: number | string; tone?: "slate" | "rose" | "amber" }) {
  const ink = tone === "rose" ? "text-rose-700" : tone === "amber" ? "text-amber-800" : "text-slate-900";
  return (
    <div className={`${card} px-4 py-3`}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${ink}`}>{value}</p>
    </div>
  );
}

/** Breached, due-today and new-today work, with a one-click action where no input is needed. */
export function Inbox({
  items,
  title,
  empty,
  quick,
  now,
}: {
  items: InboxItem[];
  title: string;
  empty: string;
  quick?: Partial<Record<Claim["stage"], { type: string; label: string }>>;
  now: Date;
}) {
  const breached = items.filter((i) => i.timing === "breached").length;
  return (
    <section className={card}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 px-5 py-4">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        <span className="text-sm text-slate-500">
          {items.length} total · <span className="font-medium text-rose-700">{breached} breached</span>
        </span>
      </div>
      {items.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-slate-500">{empty}</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map(({ claim, timing, todo, isNew }) => {
            const q = quick?.[claim.stage];
            return (
              <li key={claim.id} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1 text-sm">
                  <p className="flex flex-wrap items-center gap-1.5">
                    {isNew && <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700">New today</span>}
                    <TimingBadge claim={claim} timing={timing} now={now} />
                    <StageBadge claim={claim} />
                    <SlaChips claim={claim} now={now} />
                  </p>
                  <p className="mt-1 font-medium text-slate-900">{todo}</p>
                  <p className="truncate">
                    <ClaimLine claim={claim} />
                  </p>
                </div>
                {q ? (
                  <ActionForm claimId={claim.id} type={q.type} className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <button className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60">
                      {q.label}
                    </button>
                  </ActionForm>
                ) : (
                  <Link
                    href={`/axxion/claims/${claim.id}`}
                    className="shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Open
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** One breached SLA: which clock, how late, who it's waiting on, where it escalated. */
export function BlockerRow({ b, user, now }: { b: BlockerItem; user: AxAccount; now: Date }) {
  const c = b.claim;
  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1 text-sm">
        <p className="flex flex-wrap items-center gap-1.5">
          <Link href={`/axxion/claims/${c.id}`} className="font-semibold text-slate-900 hover:underline">
            {c.id}
          </Link>
          <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
            {b.clock.title} · {formatWorking(b.lateBy)} late
          </span>
          <SlaChips claim={c} now={now} />
        </p>
        <p className="mt-0.5 text-slate-600">
          Waiting on <span className="font-medium text-slate-800">{b.waiting.label}</span>
          <span className="text-slate-500">
            {" · "}
            {c.vehicle.make} {c.vehicle.model} · {c.insurer}
          </span>
        </p>
      </div>
      {canRemind(user, c) ? (
        <ActionForm claimId={c.id} type="remind" className="flex items-center gap-2 sm:justify-end">
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60">
            <Bell className="h-4 w-4" aria-hidden /> Send reminder
          </button>
        </ActionForm>
      ) : (
        <Link
          href={`/axxion/claims/${c.id}`}
          className="shrink-0 rounded-lg bg-slate-900 px-3 py-1.5 text-center text-sm font-medium text-white hover:bg-slate-800"
        >
          Act now
        </Link>
      )}
    </li>
  );
}

/** Breached SLAs for a role's home page. */
export function Blockers({ items, user, now, limit = 25 }: { items: BlockerItem[]; user: AxAccount; now: Date; limit?: number }) {
  return (
    <section className={`${card} border-rose-200`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rose-100 px-5 py-4">
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-slate-900">
            <AlertTriangle className="h-4 w-4 text-rose-600" aria-hidden /> Breached SLAs
          </h2>
          <p className="text-xs text-slate-500">Each has already been escalated automatically to its escalation group.</p>
        </div>
        <span className="text-sm text-slate-500">
          {items.length}
          {items.length > limit ? ` · showing ${limit}` : ""}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-slate-500">No breached SLAs.</p>
      ) : (
        <ul className="divide-y divide-slate-100 px-5">
          {items.slice(0, limit).map((b) => (
            <BlockerRow key={b.claim.id} b={b} user={user} now={now} />
          ))}
        </ul>
      )}
    </section>
  );
}

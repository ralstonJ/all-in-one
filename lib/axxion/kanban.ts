/**
 * Weekly kanban of claims-desk work: tasks owned by claim handlers and the
 * Head of Claims, across every claim (not just the viewer's).
 *   To do       = the next handler/head step a claim will reach once its current step is done.
 *   In progress = the handler/head step a claim is on now (breached ones count as this week).
 *   Done        = handler/head steps completed, from each claim's timeline.
 * Weeks run Monday–Sunday, Dubai time.
 */
import { ROLE_LABEL, getAxAccount, type AxAccount } from "@/lib/axxion/accounts";
import type { Claim, Stage } from "@/lib/axxion/types";
import { HAPPY_PATH, STAGE, canView, isOpen, timing, type Timing } from "@/lib/axxion/workflow";
import { startOfDubaiDay } from "@/lib/axxion/working-time";

export type Column = "todo" | "doing" | "done";

export type KanbanCard = {
  key: string;
  claim: Claim;
  column: Column;
  title: string;
  step: string;
  person: string;
  role: "Claim Handler" | "Head of Claims";
  isMe: boolean;
  /** Due time (in progress / to do) or completion time (done). */
  at: string;
  timing?: Timing;
  /** For to-do cards: the step that has to finish first. */
  after?: string;
  canOpen: boolean;
};

export type KanbanWeek = { key: number; label: string; range: string; isCurrent: boolean; columns: Record<Column, KanbanCard[]> };

const DAY = 24 * 60 * 60 * 1000;

/** Monday 00:00 Dubai of the week containing `d`. */
export function weekStart(d: Date | number | string): Date {
  const day = startOfDubaiDay(new Date(d));
  const weekday = new Date(day.getTime() + 4 * 60 * 60 * 1000).getUTCDay(); // 0 = Sunday, in Dubai
  return new Date(day.getTime() - ((weekday + 6) % 7) * DAY);
}

/** Steps off the happy path, and where they lead back to. */
const SIDE_NEXT: Partial<Record<Stage, Stage | null>> = {
  assign_surveyor: "initial_survey",
  replacement_garage: "survey_negotiation",
  fraud_review: "garage_award",
  qc_corrections: "qc_verify",
  rework: "qc_schedule",
  invoice_flagged: null,
  final_invoice: null,
};

function nextStage(s: Stage): Stage | null {
  if (s in SIDE_NEXT) return SIDE_NEXT[s] ?? null;
  const i = HAPPY_PATH.indexOf(s);
  return i >= 0 && i < HAPPY_PATH.length - 1 ? HAPPY_PATH[i + 1] : null;
}

/** The handler or head who owns `stage` on this claim, or null if someone else owns it. */
function deskOwner(c: Claim, stage: Stage): { id?: string; person: string; role: KanbanCard["role"] } | null {
  const owner = STAGE[stage].owner;
  if (owner === "handler") return { id: c.handlerId, person: getAxAccount(c.handlerId)?.name ?? "Claim handler", role: "Claim Handler" };
  // Head approvals go to the shared Head of Claims queue, not one person.
  if (owner === "head") return { person: "Head of Claims queue", role: "Head of Claims" };
  return null;
}

const STEP_BY_DONE = new Map(Object.values(STAGE).filter((s) => s.done).map((s) => [s.done!, s.label]));

export function buildKanban(user: AxAccount, claims: Claim[], now: Date): KanbanWeek[] {
  const thisWeek = weekStart(now).getTime();
  const cards: { week: number; card: KanbanCard }[] = [];

  for (const c of claims) {
    const canOpen = canView(user, c);

    if (isOpen(c)) {
      // Breached steps are still being worked on now, so they sit in this week.
      const week = Math.max(weekStart(c.dueAt).getTime(), thisWeek);
      const cur = deskOwner(c, c.stage);
      if (cur)
        cards.push({
          week,
          card: { key: `${c.id}-doing`, claim: c, column: "doing", title: STAGE[c.stage].todo, step: STAGE[c.stage].label, ...cur, isMe: cur.id === user.id || (cur.role === "Head of Claims" && user.role === "head"), at: c.dueAt, timing: timing(c, now), canOpen },
        });

      const next = nextStage(c.stage);
      const o = next ? deskOwner(c, next) : null;
      if (next && o)
        cards.push({
          week,
          card: { key: `${c.id}-todo`, claim: c, column: "todo", title: STAGE[next].todo, step: STAGE[next].label, ...o, isMe: o.id === user.id || (o.role === "Head of Claims" && user.role === "head"), at: c.dueAt, after: STAGE[c.stage].label, canOpen },
        });
    }

    c.events.forEach((e, i) => {
      const a = getAxAccount(e.actorId);
      if (!a || (a.role !== "handler" && a.role !== "head")) return;
      const step = STEP_BY_DONE.get(e.action);
      if (!step) return;
      cards.push({
        week: weekStart(e.at).getTime(),
        card: { key: `${c.id}-e${i}`, claim: c, column: "done", title: e.action, step, person: a.name, role: ROLE_LABEL[a.role] as KanbanCard["role"], isMe: a.id === user.id, at: e.at, canOpen },
      });
    });
  }

  const weeks = new Map<number, KanbanWeek>();
  const weekFor = (key: number) => {
    let w = weeks.get(key);
    if (!w) {
      w = { key, ...weekLabel(key, thisWeek), isCurrent: key === thisWeek, columns: { todo: [], doing: [], done: [] } };
      weeks.set(key, w);
    }
    return w;
  };
  weekFor(thisWeek);
  for (const { week, card } of cards) weekFor(week).columns[card.column].push(card);

  for (const w of weeks.values()) {
    w.columns.todo.sort((a, b) => a.at.localeCompare(b.at));
    w.columns.doing.sort((a, b) => a.at.localeCompare(b.at));
    w.columns.done.sort((a, b) => b.at.localeCompare(a.at));
  }
  // Upcoming weeks first, then this week, then history.
  return [...weeks.values()].sort((a, b) => b.key - a.key);
}

function weekLabel(start: number, thisWeek: number) {
  const diff = Math.round((start - thisWeek) / (7 * DAY));
  const label = diff === 0 ? "This week" : diff === 1 ? "Next week" : diff === -1 ? "Last week" : diff > 1 ? `In ${diff} weeks` : `${-diff} weeks ago`;
  const f = (d: number) => new Date(d).toLocaleDateString("en-GB", { timeZone: "Asia/Dubai", day: "numeric", month: "short" });
  return { label, range: `${f(start)} – ${f(start + 6 * DAY)}` };
}

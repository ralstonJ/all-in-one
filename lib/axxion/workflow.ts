/**
 * Axxion claim workflow, modelled on ClaimOS: the steps, the SLA clock each
 * step runs (from the SLA catalogue), who owns it, and derived state:
 * due today / breached, automatic reminders and escalation, visibility.
 *
 * Reminders and escalations are automatic, as in ClaimOS: a reminder fires at
 * each reminder point, and a breach (deadline passed) records the breach and
 * escalates to the clock's escalation group. Nothing here is stored; it is
 * all worked out from the step start time and the catalogue.
 */
import { getAxAccount, type AxAccount } from "@/lib/axxion/accounts";
import type { AxRole } from "@/lib/axxion/token";
import type { Activity, Claim, Stage } from "@/lib/axxion/types";
import { SLA_ACTORS, SLA_CLOCKS, type SlaActor, type SlaClock } from "@/lib/axxion/sla-catalogue";
import { HOUR, addWorking, currentWorkdayEnd, startOfDubaiDay, workingBetween, formatWorking } from "@/lib/axxion/working-time";

export { formatWorking };
export const DAY = 24 * HOUR;
export { HOUR };

/** Who acts on a step. "garages" = the garages invited to quote. */
type Owner = "handler" | "surveyor" | "head" | "insurer" | "workshop" | "garages" | null;

type StageDef = {
  label: string;
  owner: Owner;
  /** Title of the SLA clock this step runs (must match the catalogue). */
  clock?: string;
  todo: string;
  /** Activity name logged when the step is completed. */
  done?: string;
};

export const STAGE: Record<Stage, StageDef> = {
  assign_surveyor: { label: "Assign surveyor", owner: "handler", clock: "Surveyor not assigned (auto-assignment found nobody)", todo: "Assign a surveyor", done: "Surveyor assigned" },
  initial_survey: { label: "Initial survey", owner: "surveyor", clock: "Initial survey not submitted", todo: "Submit the initial survey", done: "Initial survey submitted" },
  repair_location: { label: "Repair location", owner: "handler", clock: "Preferred repair location not recorded", todo: "Record the preferred repair location", done: "Repair location recorded" },
  quotes: { label: "Quotes", owner: "garages", clock: "Quote not submitted", todo: "Submit a quote", done: "Quote submitted" },
  replacement_garage: { label: "Replacement garage", owner: "handler", clock: "Replacement garage not picked (top-up found nobody)", todo: "Pick a replacement garage", done: "Replacement garage picked" },
  survey_negotiation: { label: "Survey & negotiation", owner: "surveyor", clock: "Survey & negotiation not ready after quotes came in", todo: "Submit survey & negotiation", done: "Survey & negotiation submitted" },
  survey_signoff: { label: "Survey sign-off", owner: "head", clock: "Survey not signed off", todo: "Sign off the survey", done: "Survey signed off" },
  fraud_review: { label: "Fraud review", owner: "head", clock: "Fraud review not decided", todo: "Decide the fraud review", done: "Fraud review decided" },
  garage_award: { label: "Garage award", owner: "head", clock: "Garage award not decided", todo: "Award the garage", done: "Garage awarded" },
  lpo: { label: "Awaiting LPO", owner: "insurer", clock: "LPO not received", todo: "Record the insurer's LPO", done: "LPO received" },
  dropoff: { label: "Drop-off", owner: "handler", clock: "Customer drop-off not arranged", todo: "Arrange customer drop-off", done: "Drop-off arranged" },
  car_received: { label: "Car at garage", owner: "workshop", clock: "Car not confirmed as received", todo: "Confirm the car is received", done: "Car received" },
  repair_dates: { label: "Repair dates", owner: "workshop", clock: "Start and completion dates not entered", todo: "Enter start and completion dates", done: "Repair dates entered" },
  parts_list: { label: "Parts list", owner: "workshop", clock: "Purchased-parts list not uploaded", todo: "Upload the purchased-parts list", done: "Parts list uploaded" },
  repair: { label: "In repair", owner: "workshop", clock: "Repair not completed by expected date", todo: "Complete the repair", done: "Repair completed" },
  qc_schedule: { label: "Schedule QC", owner: "handler", clock: "Quality check not scheduled", todo: "Schedule the quality check", done: "QC scheduled" },
  qc_perform: { label: "Quality check", owner: "surveyor", clock: "Quality check not performed", todo: "Perform the quality check", done: "QC performed" },
  qc_verify: { label: "QC verification", owner: "head", clock: "Quality check not verified", todo: "Verify the quality check", done: "QC verified" },
  qc_corrections: { label: "QC corrections", owner: "surveyor", clock: "QC sent back, corrections not resubmitted", todo: "Resubmit QC corrections", done: "QC corrections resubmitted" },
  rework: { label: "Rework", owner: "workshop", clock: "Rework after failed QC not requested", todo: "Request rework after failed QC", done: "Rework requested" },
  notify_pickup: { label: "Notify pickup", owner: "handler", clock: "Customer not notified to schedule pickup", todo: "Notify the customer to schedule pickup", done: "Customer notified for pickup" },
  pickup: { label: "Customer pickup", owner: "workshop", clock: "Customer pickup not confirmed", todo: "Confirm customer pickup", done: "Pickup confirmed" },
  final_invoice: { label: "Final invoice", owner: "workshop", clock: "Final invoice not uploaded", todo: "Upload the final invoice", done: "Final invoice uploaded" },
  invoice_flagged: { label: "Invoice flagged", owner: "handler", clock: "Flagged invoice not resolved", todo: "Resolve the flagged invoice", done: "Flagged invoice resolved" },
  closed: { label: "Closed", owner: null, todo: "" },
  rejected: { label: "Rejected", owner: null, todo: "" },
};

/** Main path, in order. Side steps sit next to the step that triggers them. */
export const STAGE_ORDER: Stage[] = [
  "assign_surveyor",
  "initial_survey",
  "repair_location",
  "quotes",
  "replacement_garage",
  "survey_negotiation",
  "survey_signoff",
  "fraud_review",
  "garage_award",
  "lpo",
  "dropoff",
  "car_received",
  "repair_dates",
  "parts_list",
  "repair",
  "qc_schedule",
  "qc_perform",
  "rework",
  "qc_verify",
  "qc_corrections",
  "notify_pickup",
  "pickup",
  "final_invoice",
  "invoice_flagged",
];

export const HAPPY_PATH: Stage[] = [
  "initial_survey",
  "repair_location",
  "quotes",
  "survey_negotiation",
  "survey_signoff",
  "garage_award",
  "lpo",
  "dropoff",
  "car_received",
  "repair_dates",
  "parts_list",
  "repair",
  "qc_schedule",
  "qc_perform",
  "qc_verify",
  "notify_pickup",
  "pickup",
  "final_invoice",
];

export const isOpen = (c: Claim) => c.stage !== "closed" && c.stage !== "rejected";

const BY_TITLE = new Map(SLA_CLOCKS.map((c) => [c.title, c]));

export function clockFor(stage: Stage): SlaClock | undefined {
  const t = STAGE[stage].clock;
  return t ? BY_TITLE.get(t) : undefined;
}

/** Breach time for a step that starts at `start`. Custom-deadline clocks need the claim. */
export function deadlineFor(stage: Stage, start: Date, c?: Partial<Claim>): Date {
  if (stage === "repair" && c?.expectedCompletion) return new Date(c.expectedCompletion);
  if (stage === "pickup" && c?.pickupBy) return new Date(c.pickupBy);
  const clock = clockFor(stage);
  return addWorking(start, clock?.breachHours ?? 24);
}

/* ─── Derived state ─────────────────────────────────────────────────────── */

export function todoFor(c: Claim) {
  return STAGE[c.stage].todo;
}

/** Who the claim is waiting on right now. */
export function waitingOn(c: Claim): { owner: Owner; accountId?: string; label: string } {
  const owner = STAGE[c.stage].owner;
  switch (owner) {
    case "handler":
      return { owner, accountId: c.handlerId, label: getAxAccount(c.handlerId)?.name ?? "Claims handler" };
    case "surveyor":
      return { owner, accountId: c.surveyorId, label: getAxAccount(c.surveyorId)?.name ?? "Surveyor" };
    case "head":
      return { owner, label: "Head of Claims" };
    case "insurer":
      return { owner, label: c.insurer };
    case "workshop":
      return { owner, accountId: c.awardedWorkshopId, label: getAxAccount(c.awardedWorkshopId)?.name ?? "Garage" };
    case "garages": {
      const missing = c.invited.filter((w) => !c.quotes.some((q) => q.workshopId === w)).length;
      return { owner, label: `${missing} invited ${missing === 1 ? "garage" : "garages"} yet to quote` };
    }
    default:
      return { owner: null, label: "No one" };
  }
}

export type Timing = "breached" | "today" | "upcoming" | "done";

export function timing(c: Claim, now: Date): Timing {
  if (!isOpen(c)) return "done";
  const due = new Date(c.dueAt).getTime();
  if (due <= now.getTime()) return "breached";
  // "today" = before the end of the current working day (the next one after 18:00).
  if (due <= currentWorkdayEnd(now).getTime()) return "today";
  return "upcoming";
}

/** SLA status for the current step: reminders fired so far, breach and escalation. */
export function slaStatus(c: Claim, now: Date) {
  const clock = clockFor(c.stage);
  const start = new Date(c.stageSince);
  const due = new Date(c.dueAt);
  const actor: SlaActor | undefined = clock?.actor;
  let reminderTimes: Date[] = [];
  if (clock?.reminderHours) {
    reminderTimes = clock.reminderHours.map((h) => addWorking(start, h));
  } else if (c.stage === "repair") {
    reminderTimes = [new Date(due.getTime() - 24 * HOUR)];
  } else if (c.stage === "pickup") {
    reminderTimes = [new Date(due.getTime() - 6 * HOUR)];
  }
  const sent = reminderTimes.filter((t) => t <= now);
  const breached = isOpen(c) && due <= now;
  return {
    clock,
    actor,
    escalation: actor ? SLA_ACTORS[actor].escalation : undefined,
    remindTo: clock?.remind,
    reminderTimes,
    remindersSent: sent.length,
    breached,
    /** Working hours past the deadline (0 if not breached). */
    lateBy: breached ? workingBetween(due, now) : 0,
    /** Working hours left before breach (0 if breached). */
    leftHours: breached ? 0 : workingBetween(now, due),
  };
}

/* ─── Visibility & turns ────────────────────────────────────────────────── */

export function canView(user: AxAccount, c: Claim): boolean {
  switch (user.role) {
    case "admin":
    case "head":
      return true;
    case "handler":
      return c.handlerId === user.id;
    case "surveyor":
      return c.surveyorId === user.id;
    case "workshop":
      return c.awardedWorkshopId === user.id || c.invited.includes(user.id) || c.quotes.some((q) => q.workshopId === user.id);
  }
}

/** Is it this user's turn to act? The handler records the insurer's LPO. */
export function isMyTurn(user: AxAccount, c: Claim): boolean {
  const owner = STAGE[c.stage].owner;
  switch (owner) {
    case "handler":
    case "insurer":
      return user.role === "handler" && c.handlerId === user.id;
    case "surveyor":
      return user.role === "surveyor" && c.surveyorId === user.id;
    case "head":
      return user.role === "head";
    case "workshop":
      return user.role === "workshop" && c.awardedWorkshopId === user.id;
    case "garages":
      return user.role === "workshop" && c.invited.includes(user.id) && !c.quotes.some((q) => q.workshopId === user.id);
    default:
      return false;
  }
}

export type InboxItem = { claim: Claim; timing: Timing; todo: string; isNew: boolean };

/** Breached, due today, or new today, for this user. */
export function inboxFor(user: AxAccount, claims: Claim[], now: Date): InboxItem[] {
  const today = startOfDubaiDay(now).getTime();
  return claims
    .filter((c) => isOpen(c) && isMyTurn(user, c))
    .map((c) => ({
      claim: c,
      timing: timing(c, now),
      todo: c.stage === "lpo" ? `Chase ${c.insurer} for the LPO` : todoFor(c),
      isNew: new Date(c.stageSince).getTime() >= today,
    }))
    .filter((i) => i.timing === "breached" || i.timing === "today" || i.isNew)
    .sort((a, b) => a.claim.dueAt.localeCompare(b.claim.dueAt));
}

export type BlockerItem = {
  claim: Claim;
  clock: SlaClock;
  actor: SlaActor;
  lateBy: number;
  waiting: ReturnType<typeof waitingOn>;
};

/** Blockers are breached SLA clocks (already escalated automatically). */
export function blockersFor(user: AxAccount, claims: Claim[], now: Date): BlockerItem[] {
  return claims
    .filter((c) => {
      if (!isOpen(c) || !canView(user, c)) return false;
      if (user.role === "workshop") return isMyTurn(user, c);
      return true;
    })
    .map((c) => {
      const s = slaStatus(c, now);
      return s.breached && s.clock && s.actor
        ? { claim: c, clock: s.clock, actor: s.actor, lateBy: s.lateBy, waiting: waitingOn(c) }
        : null;
    })
    .filter((b): b is BlockerItem => !!b)
    .sort((a, b) => b.lateBy - a.lateBy);
}

/** Manual reminder (on top of ClaimOS's automatic ones): not for workshops, not for your own turn. */
export function canRemind(user: AxAccount, c: Claim): boolean {
  if (user.role === "workshop" || !isOpen(c) || !canView(user, c)) return false;
  return !isMyTurn(user, c);
}

/* ─── Metrics (admin) ───────────────────────────────────────────────────── */

export type Range = "day" | "week" | "month";
export const RANGE_DAYS: Record<Range, number> = { day: 1, week: 7, month: 30 };

export function rangeStart(range: Range, now: Date) {
  return startOfDubaiDay(now).getTime() - (RANGE_DAYS[range] - 1) * DAY;
}

export const PERSONAS: AxRole[] = ["handler", "surveyor", "head"];

export function metrics(activity: Activity[], range: Range, now: Date) {
  const start = rangeStart(range, now);
  const inRange = activity.filter((a) => {
    const t = new Date(a.at).getTime();
    return t >= start && t <= now.getTime() && PERSONAS.includes(a.role);
  });
  const byRole = Object.fromEntries(PERSONAS.map((r) => [r, inRange.filter((a) => a.role === r).length])) as Record<
    "handler" | "surveyor" | "head",
    number
  >;
  const byPerson = new Map<string, { count: number; actions: Map<string, number> }>();
  for (const a of inRange) {
    const p = byPerson.get(a.actorId) ?? { count: 0, actions: new Map() };
    p.count++;
    p.actions.set(a.action, (p.actions.get(a.action) ?? 0) + 1);
    byPerson.set(a.actorId, p);
  }
  const days: { key: number; label: string; counts: Record<string, number> }[] = [];
  const today = startOfDubaiDay(now).getTime();
  for (let i = 29; i >= 0; i--) {
    const key = today - i * DAY;
    days.push({
      key,
      label: new Date(key).toLocaleDateString("en-GB", { timeZone: "Asia/Dubai", day: "numeric", month: "short" }),
      counts: { handler: 0, surveyor: 0, head: 0 },
    });
  }
  for (const a of activity) {
    const t = new Date(a.at).getTime();
    const idx = Math.floor((t - (today - 29 * DAY)) / DAY);
    if (idx >= 0 && idx < 30 && t <= now.getTime() && PERSONAS.includes(a.role)) days[idx].counts[a.role]++;
  }
  return { total: inRange.length, byRole, byPerson, days };
}

/** Jobs done in the range against the "usual" amount for a range that long. */
export function versusUsual(activity: Activity[], range: Range, now: Date) {
  const days = RANGE_DAYS[range];
  const start = rangeStart(range, now);
  const count = (from: number, to: number, role?: AxRole) =>
    activity.filter((a) => {
      const t = new Date(a.at).getTime();
      return t >= from && t < to && PERSONAS.includes(a.role) && (!role || a.role === role);
    }).length;
  const result: Record<string, { now: number; usual: number }> = {};
  for (const role of [undefined, ...PERSONAS] as (AxRole | undefined)[]) {
    const current = count(start, now.getTime() + 1, role);
    let usual: number;
    if (range === "day") {
      // Same time of day over the last 20 working days (Mon–Sat).
      const samples: number[] = [];
      for (let back = 1; samples.length < 20 && back < 60; back++) {
        const t = now.getTime() - back * DAY;
        if (new Date(t + 4 * HOUR).getUTCDay() === 0) continue;
        samples.push(count(startOfDubaiDay(t).getTime(), t, role));
      }
      usual = samples.reduce((s, x) => s + x, 0) / Math.max(1, samples.length);
    } else {
      usual = count(start - days * DAY, start, role);
    }
    result[role ?? "all"] = { now: current, usual };
  }
  return result;
}

export { SLA_ACTORS };
export type { SlaActor };

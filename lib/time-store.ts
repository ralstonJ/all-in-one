import "server-only";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getPerson } from "@/lib/org";

/**
 * Tiny file-backed store for clock events and approval requests.
 * Lives in .data/store.json (gitignored); delete that file to reset the demo.
 */

export type ClockEvent = {
  id: string;
  personId: string;
  type: "in" | "out";
  at: string; // ISO timestamp
};

export type ApprovalType =
  | "correction"
  | "overtime"
  | "leave"
  | "parts"
  | "equipment"
  | "expense"
  | "travel";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type LeaveKind = "Annual" | "Sick" | "Unpaid";

export type Approval = {
  id: string;
  type: ApprovalType;
  personId: string;
  /** Person who must decide: the requester's manager. */
  approverId: string | null;
  submittedAt: string;
  status: ApprovalStatus;
  /** YYYY-MM-DD; first day for leave. */
  date: string;
  endDate?: string;
  leaveKind?: LeaveKind;
  clockIn?: string; // HH:MM
  clockOut?: string; // HH:MM
  hours?: number;
  /** Parts / equipment item, expense description. */
  item?: string;
  quantity?: number;
  /** Amount in AED (estimated cost or expense claimed). */
  amount?: number;
  /** Job card, vehicle or supplier reference. */
  reference?: string;
  /** Expense category. */
  category?: string;
  /** Travel destination. */
  destination?: string;
  reason: string;
  decidedAt?: string;
  decidedBy?: string;
  note?: string;
};

export type StoredCompletion = {
  taskId: string;
  personId: string;
  completedAt: string;
  comment: string;
  photos: { id: string; contentType: string }[];
};

type Store = {
  version: 1;
  events: ClockEvent[];
  approvals: Approval[];
  completions?: StoredCompletion[];
};

const FILE = path.join(process.cwd(), ".data", "store.json");

/* ─── Date helpers (server local time) ──────────────────────────────────── */

export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromKey(key: string, time = "00:00"): Date {
  const [y, m, d] = key.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}

export function addDays(key: string, n: number): string {
  const d = fromKey(key);
  d.setDate(d.getDate() + n);
  return dateKey(d);
}

/** Monday of the week containing `key`. */
export function weekStart(key: string): string {
  const d = fromKey(key);
  const offset = (d.getDay() + 6) % 7;
  return addDays(key, -offset);
}

/* ─── Persistence ───────────────────────────────────────────────────────── */

function seed(): Store {
  const today = dateKey(new Date());
  const monday = weekStart(today);
  const events: ClockEvent[] = [];
  const add = (personId: string, day: string, time: string, type: "in" | "out") =>
    events.push({ id: randomUUID(), personId, type, at: fromKey(day, time).toISOString() });

  // Earlier weekdays this week for the people with logins.
  const shifts: Record<string, [string, string]> = {
    "emily-chen": ["07:02", "15:34"],
    "aisha-rahman": ["06:48", "16:05"],
    "glen-harper": ["08:30", "17:10"],
  };
  for (let day = monday; day < today; day = addDays(day, 1)) {
    if (fromKey(day).getDay() === 0 || fromKey(day).getDay() === 6) continue;
    for (const [personId, [start, end]] of Object.entries(shifts)) {
      add(personId, day, start, "in");
      add(personId, day, "12:00", "out");
      add(personId, day, "12:30", "in");
      add(personId, day, end, "out");
    }
  }
  // Aisha is already on site today; Emily has not clocked in yet.
  if (fromKey(today).getDay() % 6 !== 0) add("aisha-rahman", today, "06:51", "in");

  const submitted = (daysAgo: number, time = "09:15") =>
    fromKey(addDays(today, -daysAgo), time).toISOString();
  const req = (a: Omit<Approval, "id" | "approverId">): Approval => ({
    id: randomUUID(),
    approverId: getPerson(a.personId)?.reportsTo ?? null,
    ...a,
  });

  const approvals: Approval[] = [
    req({
      type: "leave",
      personId: "emily-chen",
      leaveKind: "Annual",
      date: "2026-12-22",
      endDate: "2026-12-24",
      reason: "Family visit over Christmas.",
      submittedAt: submitted(2),
      status: "pending",
    }),
    req({
      type: "overtime",
      personId: "noah-kaur",
      date: addDays(today, -1),
      hours: 3,
      reason: "Stayed back to finish the Hilux timing belt job for a morning pickup.",
      submittedAt: submitted(0, "07:40"),
      status: "pending",
    }),
    req({
      type: "correction",
      personId: "ben-carter",
      date: addDays(today, -2),
      clockIn: "07:00",
      clockOut: "16:30",
      reason: "Forgot to clock out after the ADAS calibration ran late.",
      submittedAt: submitted(1, "08:05"),
      status: "pending",
    }),
    req({
      type: "leave",
      personId: "priya-nair",
      leaveKind: "Annual",
      date: "2026-12-29",
      endDate: "2026-12-31",
      reason: "Year-end break.",
      submittedAt: submitted(3),
      status: "pending",
    }),
    req({
      type: "overtime",
      personId: "marcus-bell",
      date: addDays(today, -3),
      hours: 2,
      reason: "Stocktake in the parts store after close.",
      submittedAt: submitted(2, "17:45"),
      status: "pending",
    }),
    req({
      type: "correction",
      personId: "kai-tanaka",
      date: addDays(today, -1),
      clockIn: "07:15",
      clockOut: "15:45",
      reason: "Clock-in terminal in the paint shop was offline.",
      submittedAt: submitted(0, "07:20"),
      status: "pending",
    }),
    req({
      type: "parts",
      personId: "ben-carter",
      item: "ADAS radar calibration target",
      quantity: 1,
      amount: 2850,
      reference: "Job 4471 · Lexus RX",
      date: addDays(today, 3),
      reason: "Current target is damaged; needed for the Lexus front radar calibration.",
      submittedAt: submitted(0, "10:20"),
      status: "pending",
    }),
    req({
      type: "travel",
      personId: "zoe-mitchell",
      destination: "Abu Dhabi",
      date: addDays(today, 12),
      endDate: addDays(today, 13),
      amount: 950,
      reason: "Two-day manufacturer EV high-voltage recertification course.",
      submittedAt: submitted(1, "11:30"),
      status: "pending",
    }),
    req({
      type: "expense",
      personId: "omar-haddad",
      item: "HV insulated gloves retest",
      category: "Safety",
      amount: 420,
      date: addDays(today, -4),
      reason: "Six-monthly dielectric test for two pairs of class 0 gloves.",
      submittedAt: submitted(3, "14:05"),
      status: "pending",
    }),
    req({
      type: "equipment",
      personId: "luca-ferrari",
      item: "HVLP spray gun (1.3 mm)",
      quantity: 1,
      amount: 1650,
      date: addDays(today, 7),
      reason: "Current gun is worn and spitting on clear coat.",
      submittedAt: submitted(2, "08:40"),
      status: "pending",
    }),
    req({
      type: "expense",
      personId: "aisha-rahman",
      item: "Diagnostic software subscription",
      category: "Software",
      amount: 1200,
      date: addDays(today, -6),
      reason: "Annual renewal paid on my card so the scan tools didn't lapse.",
      submittedAt: submitted(5, "16:00"),
      status: "approved",
      decidedAt: submitted(4, "09:00"),
      decidedBy: "Marcus Bell",
    }),
    req({
      type: "leave",
      personId: "zoe-mitchell",
      leaveKind: "Sick",
      date: monday,
      endDate: monday,
      reason: "Unwell.",
      submittedAt: fromKey(monday, "06:30").toISOString(),
      status: "approved",
      decidedAt: fromKey(monday, "07:10").toISOString(),
      decidedBy: "Aisha Rahman",
    }),
    req({
      type: "overtime",
      personId: "emily-chen",
      date: addDays(today, -8),
      hours: 2,
      reason: "Extra roadworthy inspections.",
      submittedAt: submitted(8, "16:10"),
      status: "rejected",
      decidedAt: submitted(7, "08:00"),
      decidedBy: "Aisha Rahman",
      note: "Overtime needs to be agreed before the shift.",
    }),
  ];

  return { version: 1, events, approvals };
}

function load(): Store {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8")) as Store;
  } catch {
    const fresh = seed();
    save(fresh);
    return fresh;
  }
}

function save(store: Store) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(store, null, 2));
}

/* ─── Clock ─────────────────────────────────────────────────────────────── */

export type Session = { in: Date; out: Date | null };

export function getEvents(personId: string): ClockEvent[] {
  return load()
    .events.filter((e) => e.personId === personId)
    .sort((a, b) => a.at.localeCompare(b.at));
}

export function getClockStatus(personId: string): { clockedIn: boolean; since: Date | null } {
  const events = getEvents(personId);
  const last = events[events.length - 1];
  return last?.type === "in"
    ? { clockedIn: true, since: new Date(last.at) }
    : { clockedIn: false, since: last ? new Date(last.at) : null };
}

/** Ignore a clock change this soon after the previous one (double clicks, resubmits). */
const MIN_GAP_MS = 10_000;

export function clock(personId: string, type: "in" | "out"): { error?: string } {
  const status = getClockStatus(personId);
  if (type === "in" && status.clockedIn) return { error: "You are already clocked in." };
  if (type === "out" && !status.clockedIn) return { error: "You are not clocked in." };
  if (status.since && Date.now() - status.since.getTime() < MIN_GAP_MS)
    return { error: "You just clocked. Wait a few seconds and try again." };
  const store = load();
  store.events.push({ id: randomUUID(), personId, type, at: new Date().toISOString() });
  save(store);
  return {};
}

export function getSessions(personId: string, day: string): Session[] {
  const sessions: Session[] = [];
  for (const e of getEvents(personId)) {
    if (dateKey(new Date(e.at)) !== day) continue;
    if (e.type === "in") sessions.push({ in: new Date(e.at), out: null });
    else if (sessions.length && !sessions[sessions.length - 1].out)
      sessions[sessions.length - 1].out = new Date(e.at);
  }
  return sessions;
}

export function workedMinutes(sessions: Session[], now = new Date()): number {
  return sessions.reduce(
    (sum, s) => sum + Math.max(0, ((s.out ?? now).getTime() - s.in.getTime()) / 60000),
    0,
  );
}

/* ─── Approvals ─────────────────────────────────────────────────────────── */

export type Viewer = { isAdmin: boolean; personId: string | null; name: string };

export function canDecide(viewer: Viewer, approval: Approval): boolean {
  return viewer.isAdmin || (!!viewer.personId && approval.approverId === viewer.personId);
}

export function getApprovals(): Approval[] {
  return load().approvals.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export function pendingFor(viewer: Viewer): Approval[] {
  return getApprovals().filter((a) => a.status === "pending" && canDecide(viewer, a));
}

export function createApproval(
  input: Omit<Approval, "id" | "approverId" | "submittedAt" | "status">,
): Approval {
  const approval: Approval = {
    ...input,
    id: randomUUID(),
    approverId: getPerson(input.personId)?.reportsTo ?? null,
    submittedAt: new Date().toISOString(),
    status: "pending",
  };
  const store = load();
  store.approvals.push(approval);
  save(store);
  return approval;
}

export function decide(
  id: string,
  decision: "approved" | "rejected",
  viewer: Viewer,
  note: string,
): { error?: string } {
  const store = load();
  const approval = store.approvals.find((a) => a.id === id);
  if (!approval) return { error: "Request not found." };
  if (approval.status !== "pending") return { error: "This request was already decided." };
  if (!canDecide(viewer, approval)) return { error: "You can't decide this request." };

  approval.status = decision;
  approval.decidedAt = new Date().toISOString();
  approval.decidedBy = viewer.name;
  if (note) approval.note = note;

  // An approved correction adds the missing clock events for that day.
  if (decision === "approved" && approval.type === "correction") {
    for (const [type, time] of [
      ["in", approval.clockIn],
      ["out", approval.clockOut],
    ] as const) {
      if (time)
        store.events.push({
          id: randomUUID(),
          personId: approval.personId,
          type,
          at: fromKey(approval.date, time).toISOString(),
        });
    }
  }
  save(store);
  return {};
}

/* ─── Task completions ──────────────────────────────────────────────────── */

export const UPLOAD_DIR = path.join(process.cwd(), ".data", "uploads");

export function getCompletions(personId: string): StoredCompletion[] {
  return (load().completions ?? []).filter((c) => c.personId === personId);
}

export function getCompletion(taskId: string): StoredCompletion | undefined {
  return (load().completions ?? []).find((c) => c.taskId === taskId);
}

export function saveCompletion(completion: StoredCompletion) {
  const store = load();
  store.completions = (store.completions ?? []).filter((c) => c.taskId !== completion.taskId);
  store.completions.push(completion);
  save(store);
}

export function removeCompletion(taskId: string): StoredCompletion | undefined {
  const store = load();
  const existing = (store.completions ?? []).find((c) => c.taskId === taskId);
  store.completions = (store.completions ?? []).filter((c) => c.taskId !== taskId);
  save(store);
  return existing;
}

/** Look up which completion a stored photo belongs to (for access checks). */
export function findPhoto(photoId: string): StoredCompletion | undefined {
  return (load().completions ?? []).find((c) => c.photos.some((p) => p.id === photoId));
}

import "server-only";
import { readJson, writeJson } from "@/lib/data-store";
import { accountsByRole, getAxAccount, type AxAccount } from "@/lib/axxion/accounts";
import { seedAxxion } from "@/lib/axxion/seed";
import type { AxStore, Claim, Stage } from "@/lib/axxion/types";
import { STAGE, canRemind, canView, deadlineFor, isMyTurn, waitingOn } from "@/lib/axxion/workflow";
import { addWorking } from "@/lib/axxion/working-time";

/** File-backed store: axxion.json in the data folder (see lib/data-store.ts). Delete it to reset the demo. */

function load(): AxStore {
  const stored = readJson<AxStore>("axxion.json");
  if (stored?.version === 2) return stored;
  const fresh = seedAxxion();
  save(fresh);
  return fresh;
}

function save(store: AxStore) {
  writeJson("axxion.json", store);
}

function enter(c: Claim, stage: Stage, at = new Date()) {
  c.stage = stage;
  c.stageSince = at.toISOString();
  c.dueAt = deadlineFor(stage, at, c).toISOString();
}

/** Quote windows that have closed move the claim on, as ClaimOS does. */
function tick(store: AxStore, now: Date): boolean {
  let changed = false;
  for (const c of store.claims) {
    if (c.stage === "quotes" && c.quoteDueAt && new Date(c.quoteDueAt) <= now) {
      const at = new Date(c.quoteDueAt);
      const missing = c.invited.filter((w) => !c.quotes.some((q) => q.workshopId === w));
      if (missing.length)
        c.events.push({
          at: at.toISOString(),
          actorId: "system",
          action: "Quote not submitted: breached, escalated to WORKSHOP ESCALATION",
          note: missing.map((w) => getAxAccount(w)?.name ?? w).join(", "),
        });
      if (c.quotes.length) enter(c, "survey_negotiation", at);
      else {
        enter(c, "replacement_garage", at);
        c.events.push({ at: at.toISOString(), actorId: "system", action: "Top-up found no other garage" });
      }
      changed = true;
    }
  }
  return changed;
}

export function readStore(now = new Date()): AxStore {
  const store = load();
  if (tick(store, now)) save(store);
  return store;
}

export function getClaim(id: string): Claim | undefined {
  return readStore().claims.find((c) => c.id === id);
}

function log(store: AxStore, c: Claim, user: AxAccount, action: string, note?: string) {
  const at = new Date().toISOString();
  c.events.push({ at, actorId: user.id, action, note });
  if (user.role === "handler" || user.role === "surveyor" || user.role === "head")
    store.activity.push({ at, actorId: user.id, role: user.role, action, claimId: c.id });
}

export type ActionInput =
  | { type: "assignSurveyor"; surveyorId: string }
  | { type: "initialSurvey"; estimate: number; notes: string; fraud: boolean }
  | { type: "repairLocation"; location: string }
  | { type: "submitQuote"; amount: number; days: number }
  | { type: "pickReplacement"; workshopId: string }
  | { type: "surveyNegotiation"; notes: string }
  | { type: "signOff" }
  | { type: "fraudDecision"; decision: "clear" | "reject"; note?: string }
  | { type: "awardGarage"; workshopId: string }
  | { type: "lpoReceived" }
  | { type: "dropoff"; when: string }
  | { type: "carReceived" }
  | { type: "repairDates"; start: string; end: string }
  | { type: "partsList"; list: string }
  | { type: "repairDone" }
  | { type: "scheduleQc"; when: string }
  | { type: "performQc"; passed: boolean; notes: string }
  | { type: "verifyQc"; decision: "verify" | "sendBack"; note?: string }
  | { type: "qcCorrections"; notes: string }
  | { type: "requestRework" }
  | { type: "notifyPickup"; by: string }
  | { type: "confirmPickup" }
  | { type: "finalInvoice"; amount: number }
  | { type: "resolveInvoice"; note?: string }
  | { type: "remind" };

const REQUIRED: Record<Exclude<ActionInput["type"], "remind">, Stage> = {
  assignSurveyor: "assign_surveyor",
  initialSurvey: "initial_survey",
  repairLocation: "repair_location",
  submitQuote: "quotes",
  pickReplacement: "replacement_garage",
  surveyNegotiation: "survey_negotiation",
  signOff: "survey_signoff",
  fraudDecision: "fraud_review",
  awardGarage: "garage_award",
  lpoReceived: "lpo",
  dropoff: "dropoff",
  carReceived: "car_received",
  repairDates: "repair_dates",
  partsList: "parts_list",
  repairDone: "repair",
  scheduleQc: "qc_schedule",
  performQc: "qc_perform",
  verifyQc: "qc_verify",
  qcCorrections: "qc_corrections",
  requestRework: "rework",
  notifyPickup: "notify_pickup",
  confirmPickup: "pickup",
  finalInvoice: "final_invoice",
  resolveInvoice: "invoice_flagged",
};

const DATE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/;
/** A date (and optional time) entered in Dubai local time. */
function dubai(value: string, defaultTime = "18:00"): Date | null {
  if (!DATE.test(value)) return null;
  const withTime = value.includes("T") ? value : `${value}T${defaultTime}`;
  const d = new Date(`${withTime}:00+04:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Apply an action after checking role, access and step. */
export function act(user: AxAccount, claimId: string, input: ActionInput): { error?: string } {
  const now = new Date();
  const store = readStore(now);
  const c = store.claims.find((x) => x.id === claimId);
  if (!c || !canView(user, c)) return { error: "Claim not found." };

  if (input.type === "remind") {
    if (!canRemind(user, c)) return { error: "You can't send a reminder on this claim." };
    const w = waitingOn(c);
    c.events.push({ at: now.toISOString(), actorId: user.id, action: `Manual reminder sent to ${w.label}` });
    save(store);
    return {};
  }

  if (c.stage !== REQUIRED[input.type])
    return { error: input.type === "submitQuote" ? "The quote window has closed." : "This claim has already moved on." };
  if (!isMyTurn(user, c)) return { error: "It isn't your turn on this claim." };
  const done = (note?: string) => log(store, c, user, STAGE[c.stage].done!, note);

  switch (input.type) {
    case "assignSurveyor": {
      const s = getAxAccount(input.surveyorId);
      if (s?.role !== "surveyor") return { error: "Pick a surveyor." };
      c.surveyorId = s.id;
      done(s.name);
      enter(c, "initial_survey", now);
      break;
    }
    case "initialSurvey":
      if (!(input.estimate > 0)) return { error: "Enter the estimate." };
      if (!input.notes.trim()) return { error: "Add survey notes." };
      c.estimate = input.estimate;
      c.surveyNotes = input.notes.trim();
      c.fraudFlag = input.fraud;
      done(input.fraud ? "Fraud suspicion flagged" : undefined);
      enter(c, "repair_location", now);
      break;
    case "repairLocation": {
      if (!input.location.trim()) return { error: "Enter the preferred repair location." };
      c.preferredLocation = input.location.trim();
      done(c.preferredLocation);
      const garages = AX_GARAGES(c.emirate).slice(0, 3);
      c.invited = garages;
      c.quotes = [];
      enter(c, "quotes", now);
      c.quoteRequestedAt = c.stageSince;
      c.quoteDueAt = c.dueAt;
      c.events.push({ at: now.toISOString(), actorId: "system", action: `Quotes requested from ${garages.length} garages` });
      break;
    }
    case "submitQuote": {
      if (!(input.amount > 0) || input.amount > 1_000_000) return { error: "Enter a valid quote amount." };
      if (!(input.days >= 1 && input.days <= 60)) return { error: "Repair days must be between 1 and 60." };
      c.quotes.push({ workshopId: user.id, amount: Math.round(input.amount), days: Math.round(input.days), submittedAt: now.toISOString() });
      c.events.push({ at: now.toISOString(), actorId: user.id, action: "Quote submitted" });
      if (c.invited.every((w) => c.quotes.some((q) => q.workshopId === w))) {
        c.events.push({ at: now.toISOString(), actorId: "system", action: "All quotes received" });
        enter(c, "survey_negotiation", now);
      }
      break;
    }
    case "pickReplacement": {
      const w = getAxAccount(input.workshopId);
      if (w?.role !== "workshop") return { error: "Pick a garage." };
      done(w.name);
      c.invited = [...new Set([...c.invited, w.id])];
      enter(c, "quotes", now);
      c.quoteRequestedAt = c.stageSince;
      c.quoteDueAt = c.dueAt;
      break;
    }
    case "surveyNegotiation":
      if (!input.notes.trim()) return { error: "Add the negotiation notes." };
      c.negotiationNotes = input.notes.trim();
      done();
      enter(c, "survey_signoff", now);
      break;
    case "signOff":
      c.signedOffBy = user.id;
      done();
      enter(c, c.fraudFlag ? "fraud_review" : "garage_award", now);
      break;
    case "fraudDecision":
      done(input.decision === "clear" ? "Cleared" : `Rejected${input.note ? `: ${input.note}` : ""}`);
      if (input.decision === "clear") enter(c, "garage_award", now);
      else {
        c.rejectedReason = input.note || "Rejected after fraud review";
        enter(c, "rejected", now);
      }
      break;
    case "awardGarage": {
      const q = c.quotes.find((x) => x.workshopId === input.workshopId);
      if (!q) return { error: "Pick one of the quotes." };
      c.awardedWorkshopId = q.workshopId;
      done(`${getAxAccount(q.workshopId)?.name} at AED ${q.amount.toLocaleString("en-AE")}`);
      enter(c, "lpo", now);
      break;
    }
    case "lpoReceived":
      c.lpoAt = now.toISOString();
      done(`From ${c.insurer}`);
      enter(c, "dropoff", now);
      break;
    case "dropoff": {
      const when = dubai(input.when, "10:00");
      if (!when) return { error: "Pick the drop-off date and time." };
      c.dropoffAt = when.toISOString();
      done(`Drop-off ${when.toLocaleString("en-GB", { timeZone: "Asia/Dubai", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`);
      enter(c, "car_received", now);
      break;
    }
    case "carReceived":
      c.carReceivedAt = now.toISOString();
      done();
      enter(c, "repair_dates", now);
      break;
    case "repairDates": {
      const s = dubai(input.start, "09:00");
      const e = dubai(input.end, "18:00");
      if (!s || !e || e <= s) return { error: "Enter a start date and a later completion date." };
      c.repairStart = s.toISOString();
      c.expectedCompletion = e.toISOString();
      done();
      enter(c, "parts_list", now);
      break;
    }
    case "partsList":
      if (!input.list.trim()) return { error: "List the purchased parts." };
      c.partsList = input.list.trim();
      done();
      enter(c, "repair", now);
      break;
    case "repairDone":
      c.repairDoneAt = now.toISOString();
      done();
      enter(c, "qc_schedule", now);
      break;
    case "scheduleQc": {
      const when = dubai(input.when, "10:00");
      if (!when) return { error: "Pick the QC date and time." };
      c.qcScheduledAt = when.toISOString();
      done();
      enter(c, "qc_perform", now);
      break;
    }
    case "performQc":
      if (!input.notes.trim()) return { error: "Add QC notes." };
      c.qcResult = { passed: input.passed, notes: input.notes.trim(), at: now.toISOString() };
      done(input.passed ? "Passed" : `Failed: ${input.notes.trim()}`);
      enter(c, input.passed ? "qc_verify" : "rework", now);
      break;
    case "verifyQc":
      if (input.decision === "verify") {
        c.qcVerifiedAt = now.toISOString();
        done();
        enter(c, "notify_pickup", now);
      } else {
        log(store, c, user, "QC sent back", input.note);
        enter(c, "qc_corrections", now);
      }
      break;
    case "qcCorrections":
      if (!input.notes.trim()) return { error: "Describe the corrections." };
      done(input.notes.trim());
      enter(c, "qc_verify", now);
      break;
    case "requestRework":
      c.reworkCount += 1;
      c.expectedCompletion = addWorking(now, 18).toISOString();
      done("Two working days to rework");
      enter(c, "repair", now);
      break;
    case "notifyPickup": {
      const by = dubai(input.by, "18:00");
      if (!by || by <= now) return { error: "Pick a pickup deadline in the future." };
      c.pickupBy = by.toISOString();
      done();
      enter(c, "pickup", now);
      break;
    }
    case "confirmPickup":
      c.pickedUpAt = now.toISOString();
      done();
      enter(c, "final_invoice", now);
      break;
    case "finalInvoice": {
      if (!(input.amount > 0)) return { error: "Enter the invoice amount." };
      c.invoiceAmount = Math.round(input.amount);
      done();
      const quoted = c.quotes.find((q) => q.workshopId === c.awardedWorkshopId)?.amount;
      if (quoted && Math.abs(c.invoiceAmount - quoted) / quoted > 0.05) {
        c.invoiceFlag = `Invoice is ${Math.round(((c.invoiceAmount - quoted) / quoted) * 100)}% off the awarded quote.`;
        enter(c, "invoice_flagged", now);
      } else {
        c.closedAt = now.toISOString();
        enter(c, "closed", now);
      }
      break;
    }
    case "resolveInvoice":
      done(input.note);
      c.invoiceFlag = undefined;
      c.closedAt = now.toISOString();
      enter(c, "closed", now);
      break;
  }
  save(store);
  return {};
}

/** Garages in an emirate (falls back to all garages). */
function AX_GARAGES(emirate: Claim["emirate"]): string[] {
  const all = accountsByRole("workshop");
  const local = all.filter((w) => w.emirate === emirate);
  return (local.length >= 3 ? local : all).map((w) => w.id);
}

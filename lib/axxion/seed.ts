/**
 * Deterministic demo data for the Axxion portal, following the ClaimOS
 * workflow: ~120 open claims spread over every step (with breached, due-today
 * and later SLA deadlines in working time), plus 90 days of completed work.
 *
 * Each claim is built backwards from its current step so every earlier step
 * happened in order and within plausible working-time durations.
 */
import { accountsByRole, type Emirate } from "@/lib/axxion/accounts";
import type { Activity, AxStore, Claim, ClaimEvent, Stage } from "@/lib/axxion/types";
import { HAPPY_PATH, STAGE, clockFor, deadlineFor } from "@/lib/axxion/workflow";
import { HOUR, addWorking, currentWorkdayEnd, startOfDubaiDay, subWorking, workingBetween } from "@/lib/axxion/working-time";

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const VEHICLES: [string, string][] = [
  ["Toyota", "Land Cruiser"], ["Toyota", "Camry"], ["Nissan", "Patrol"], ["Nissan", "Altima"], ["Lexus", "LX 600"],
  ["Mitsubishi", "Pajero"], ["Hyundai", "Tucson"], ["Kia", "Sportage"], ["Ford", "Explorer"], ["Chevrolet", "Tahoe"],
  ["Mercedes-Benz", "C 200"], ["BMW", "X5"], ["Tesla", "Model Y"], ["Honda", "Accord"],
];
const INCIDENTS = [
  "Rear-ended at traffic signal", "Side-swipe while changing lanes", "Parking lot collision, front bumper",
  "Hit a kerb, wheel and suspension damage", "Hail damage to roof and bonnet", "Reversing collision with pillar",
  "Front-end collision on highway", "Door struck by another vehicle",
];
const INSURERS = ["Gulf Mutual", "Emirates Shield", "Al Noor Takaful", "Desert Union Insurance"];
const FIRST = ["Mohammed", "Aisha", "Rahul", "Maria", "Yousef", "Chen", "Hind", "John", "Sana", "Abdullah", "Elena", "Faisal"];
const LAST = ["Al Mansoori", "Khan", "Nair", "Santos", "Al Marri", "Wei", "Al Nuaimi", "Smith", "Iqbal", "Al Dhaheri", "Popescu", "Rashid"];
const PLATE: Record<Emirate, string> = { Dubai: "Dubai", "Abu Dhabi": "Abu Dhabi", Sharjah: "Sharjah", Ajman: "Ajman", "Ras Al Khaimah": "RAK" };
const AREAS: Record<Emirate, string[]> = {
  Dubai: ["Al Quoz", "Al Qusais", "Ras Al Khor"],
  "Abu Dhabi": ["Mussafah", "Al Mafraq"],
  Sharjah: ["Industrial Area 5", "Al Sajaa"],
  Ajman: ["Al Jurf"],
  "Ras Al Khaimah": ["Al Hulaila"],
};

/** Current-step weights: roughly where open claims sit in practice. */
const WEIGHTS: [Stage, number][] = [
  ["assign_surveyor", 2], ["initial_survey", 7], ["repair_location", 5], ["quotes", 10], ["replacement_garage", 2],
  ["survey_negotiation", 8], ["survey_signoff", 6], ["fraud_review", 2], ["garage_award", 6], ["lpo", 7],
  ["dropoff", 5], ["car_received", 4], ["repair_dates", 4], ["parts_list", 4], ["repair", 12],
  ["qc_schedule", 5], ["qc_perform", 5], ["qc_verify", 4], ["qc_corrections", 2], ["rework", 2],
  ["notify_pickup", 4], ["pickup", 4], ["final_invoice", 5], ["invoice_flagged", 2],
];

/** Where a side step is triggered from. */
const SIDE: Partial<Record<Stage, Stage>> = {
  replacement_garage: "quotes",
  fraud_review: "survey_signoff",
  rework: "qc_perform",
  qc_corrections: "qc_verify",
  invoice_flagged: "final_invoice",
};

export function seedAxxion(now = new Date()): AxStore {
  const r = rng(20261126);
  const pick = <T,>(xs: readonly T[]) => xs[Math.floor(r() * xs.length)];
  const between = (a: number, b: number) => a + r() * (b - a);
  const iso = (d: Date | number) => new Date(d).toISOString();
  const nowMs = now.getTime();

  const handlers = accountsByRole("handler");
  const surveyors = accountsByRole("surveyor");
  const heads = accountsByRole("head");
  const workshops = accountsByRole("workshop");

  const weighted = (): Stage => {
    const total = WEIGHTS.reduce((s, [, w]) => s + w, 0);
    let x = r() * total;
    for (const [s, w] of WEIGHTS) if ((x -= w) < 0) return s;
    return "initial_survey";
  };

  /** Desired deadline: ~30% breached, ~25% later today, ~45% later. */
  const desiredDue = (): number => {
    const x = r();
    if (x < 0.3) return Math.min(subWorking(now, between(0.2, 20)).getTime(), nowMs - 60_000);
    const eod = currentWorkdayEnd(now).getTime();
    if (x < 0.55) return addWorking(now, between(0.1, Math.max(0.2, workingBetween(now, eod) - 0.1))).getTime();
    return addWorking(now, between(9, 36)).getTime();
  };

  const claims: Claim[] = [];
  for (let i = 0; i < 120; i++) {
    const stage = weighted();
    const emirate = pick(["Dubai", "Dubai", "Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah"] as const);
    const local = workshops.filter((w) => w.emirate === emirate);
    const garagePool = local.length >= 3 ? local : workshops;
    const localSurveyors = surveyors.filter((s) => s.emirate === emirate);
    const surveyor = pick(localSurveyors.length ? localSurveyors : surveyors);
    const handler = handlers[i % handlers.length];
    const head = pick(heads);
    const [make, model] = pick(VEHICLES);
    const estimate = Math.round(between(2500, 32000) / 50) * 50;

    const c: Claim = {
      id: `AXC-${26000 + i * 7 + 3}`,
      insurer: pick(INSURERS),
      policyNo: `MTR-${100000 + Math.floor(r() * 899999)}`,
      insured: `${pick(FIRST)} ${pick(LAST)}`,
      phone: `+971 5${Math.floor(r() * 9)} ${100 + Math.floor(r() * 899)} ${1000 + Math.floor(r() * 8999)}`,
      emirate,
      vehicle: { make, model, year: 2016 + Math.floor(r() * 10), plate: `${PLATE[emirate]} ${"ABCDEFGHJKLMN"[Math.floor(r() * 13)]} ${10000 + Math.floor(r() * 89999)}` },
      incident: pick(INCIDENTS),
      incidentDate: "",
      createdAt: "",
      handlerId: handler.id,
      surveyorId: stage === "assign_surveyor" ? undefined : surveyor.id,
      stage,
      stageSince: "",
      dueAt: "",
      invited: [],
      quotes: [],
      reworkCount: 0,
      events: [],
    };

    // Path of completed steps before the current one.
    const anchor = SIDE[stage] ?? stage;
    const idx = HAPPY_PATH.indexOf(anchor);
    const before: Stage[] = stage === "assign_surveyor" ? [] : HAPPY_PATH.slice(0, SIDE[stage] ? idx + 1 : Math.max(0, idx));

    // Current step: pick a deadline, then derive the start (never in the future).
    let start: Date;
    if (stage === "repair") {
      const due = desiredDue();
      c.expectedCompletion = iso(due);
      start = new Date(Math.min(subWorking(due, between(18, 60)).getTime(), nowMs - 10 * 60_000));
      c.dueAt = iso(due);
    } else if (stage === "pickup") {
      const due = desiredDue();
      c.pickupBy = iso(due);
      start = new Date(Math.min(subWorking(due, between(4, 18)).getTime(), nowMs - 10 * 60_000));
      c.dueAt = iso(due);
    } else {
      const hours = clockFor(stage)?.breachHours ?? 24;
      let due = desiredDue();
      if (stage === "quotes") due = addWorking(now, between(0.5, 10)).getTime(); // an open quote window
      start = new Date(Math.min(subWorking(due, hours).getTime(), nowMs - 5 * 60_000));
      c.dueAt = iso(deadlineFor(stage, start, c));
    }
    c.stageSince = iso(start);

    const ev: ClaimEvent[] = [];
    const log = (at: Date | number, actorId: string, action: string, note?: string) => ev.push({ at: iso(at), actorId, action, note });

    // Current-step context.
    const invite = () => [...garagePool].sort(() => r() - 0.5).slice(0, 3).map((w) => w.id);
    if (stage === "quotes") {
      c.invited = invite();
      c.quoteRequestedAt = c.stageSince;
      c.quoteDueAt = c.dueAt;
      const n = Math.floor(between(0, 3));
      for (const w of c.invited.slice(0, n)) {
        const at = between(start.getTime(), nowMs);
        c.quotes.push({ workshopId: w, amount: Math.round((estimate * between(0.85, 1.15)) / 10) * 10, days: Math.round(between(3, 10)), submittedAt: iso(at) });
        log(at, w, "Quote submitted");
      }
    }
    if (stage === "replacement_garage") {
      c.invited = invite();
      c.quoteRequestedAt = iso(subWorking(start, 12));
      c.quoteDueAt = c.stageSince;
      log(start, "system", "Quote not submitted: breached, escalated to WORKSHOP ESCALATION", "Top-up found no other garage");
    }

    // Walk backwards through completed steps.
    let t = start;
    for (let k = before.length - 1; k >= 0; k--) {
      const s = before[k];
      const doneAt = t;
      const hours = s === "repair" ? between(18, 60) : (clockFor(s)?.breachHours ?? 24) * between(0.2, 0.95);
      const startedAt = subWorking(doneAt, Math.max(0.1, hours));
      switch (s) {
        case "initial_survey":
          c.estimate = estimate;
          c.surveyNotes = "Damage consistent with the reported incident. Repairable.";
          c.fraudFlag = stage === "fraud_review";
          log(doneAt, surveyor.id, STAGE[s].done!);
          break;
        case "repair_location":
          c.preferredLocation = `${pick(AREAS[emirate])}, ${emirate}`;
          log(doneAt, handler.id, STAGE[s].done!, c.preferredLocation);
          break;
        case "quotes": {
          if (!c.invited.length) c.invited = invite();
          c.quoteRequestedAt = iso(startedAt);
          c.quoteDueAt = iso(addWorking(startedAt, 12));
          if (stage !== "replacement_garage") {
            const n = Math.floor(between(2, 4));
            for (const w of c.invited.slice(0, n)) {
              const at = between(startedAt.getTime(), doneAt.getTime());
              c.quotes.push({ workshopId: w, amount: Math.round((estimate * between(0.85, 1.15)) / 10) * 10, days: Math.round(between(3, 10)), submittedAt: iso(at) });
              log(at, w, "Quote submitted");
            }
          }
          log(startedAt, "system", `Quotes requested from ${c.invited.length} garages`);
          break;
        }
        case "survey_negotiation":
          c.negotiationNotes = "Negotiated labour hours with the garages; parts at OEM list price.";
          log(doneAt, surveyor.id, STAGE[s].done!);
          break;
        case "survey_signoff":
          c.signedOffBy = head.id;
          log(doneAt, head.id, STAGE[s].done!);
          break;
        case "garage_award": {
          const best = [...c.quotes].sort((a, b) => a.amount - b.amount)[0];
          c.awardedWorkshopId = best?.workshopId ?? c.invited[0];
          log(doneAt, head.id, STAGE[s].done!);
          break;
        }
        case "lpo":
          c.lpoAt = iso(doneAt);
          log(doneAt, handler.id, STAGE[s].done!, `From ${c.insurer}`);
          break;
        case "dropoff":
          c.dropoffAt = iso(doneAt);
          log(doneAt, handler.id, STAGE[s].done!);
          break;
        case "car_received":
          c.carReceivedAt = iso(doneAt);
          log(doneAt, c.awardedWorkshopId!, STAGE[s].done!);
          break;
        case "repair_dates": {
          c.repairStart = iso(doneAt);
          const days = c.quotes.find((q) => q.workshopId === c.awardedWorkshopId)?.days ?? 5;
          c.expectedCompletion ??= iso(addWorking(doneAt, days * 9));
          log(doneAt, c.awardedWorkshopId!, STAGE[s].done!);
          break;
        }
        case "parts_list":
          c.partsList = "Front bumper cover, headlamp assembly, clips and fixings";
          log(doneAt, c.awardedWorkshopId!, STAGE[s].done!);
          break;
        case "repair":
          c.repairDoneAt = iso(doneAt);
          log(doneAt, c.awardedWorkshopId!, STAGE[s].done!);
          break;
        case "qc_schedule":
          c.qcScheduledAt = iso(doneAt);
          log(doneAt, handler.id, STAGE[s].done!);
          break;
        case "qc_perform":
          c.qcResult = { passed: stage !== "rework", notes: stage === "rework" ? "Paint mismatch on the front bumper." : "Repair meets standard.", at: iso(doneAt) };
          log(doneAt, surveyor.id, STAGE[s].done!, c.qcResult.passed ? "Passed" : `Failed: ${c.qcResult.notes}`);
          break;
        case "qc_verify":
          if (stage === "qc_corrections") log(doneAt, head.id, "QC sent back", "Photos of the door shut lines missing.");
          else {
            c.qcVerifiedAt = iso(doneAt);
            log(doneAt, head.id, STAGE[s].done!);
          }
          break;
        case "notify_pickup":
          c.pickupBy ??= iso(addWorking(doneAt, 16));
          log(doneAt, handler.id, STAGE[s].done!);
          break;
        case "pickup":
          c.pickedUpAt = iso(doneAt);
          log(doneAt, c.awardedWorkshopId!, STAGE[s].done!);
          break;
        case "final_invoice": {
          const q = c.quotes.find((x) => x.workshopId === c.awardedWorkshopId);
          c.invoiceAmount = Math.round((q?.amount ?? estimate) * (stage === "invoice_flagged" ? 1.12 : 1));
          if (stage === "invoice_flagged") c.invoiceFlag = "Invoice is 12% above the awarded quote.";
          log(doneAt, c.awardedWorkshopId!, STAGE[s].done!);
          break;
        }
      }
      t = startedAt;
    }
    if (stage === "repair_dates" || stage === "parts_list") c.expectedCompletion = undefined;
    if (stage === "repair" && !c.repairStart) c.repairStart = c.stageSince;

    // Registration and surveyor assignment.
    const created = subWorking(t, between(0.2, 2));
    c.createdAt = iso(created);
    c.incidentDate = iso(created.getTime() - between(2, 48) * HOUR);
    log(created, handler.id, "Claim registered");
    if (stage === "assign_surveyor") log(created, "system", "Auto-assignment found no available surveyor");
    else log(created.getTime() + 2 * 60_000, "system", "Surveyor auto-assigned", surveyor.name);

    c.events = ev.filter((e) => new Date(e.at).getTime() <= nowMs).sort((a, b) => a.at.localeCompare(b.at));
    claims.push(c);
  }

  /* 90 days of completed work (Mon–Sat working days). */
  const ACTIONS = {
    handler: [["Repair location recorded", 3], ["Drop-off arranged", 3], ["QC scheduled", 3], ["Customer notified for pickup", 3], ["LPO received", 3], ["Flagged invoice resolved", 1], ["Surveyor assigned", 1], ["Replacement garage picked", 1]],
    surveyor: [["Initial survey submitted", 4], ["Survey & negotiation submitted", 3], ["QC performed", 3], ["QC corrections resubmitted", 1]],
    head: [["Survey signed off", 4], ["Garage awarded", 4], ["QC verified", 3], ["Fraud review decided", 1]],
  } as const;
  const activity: Activity[] = [];
  const people = [...handlers, ...surveyors, ...heads];
  const pace: Record<string, number> = {};
  for (const p of people) pace[p.id] = between(0.7, 1.25);
  const today = startOfDubaiDay(now).getTime();
  for (let d = 89; d >= 0; d--) {
    const dayStart = today - d * 24 * HOUR;
    const sunday = new Date(dayStart + 4 * HOUR).getUTCDay() === 0;
    if (sunday) continue;
    for (const p of people) {
      const role = p.role as "handler" | "surveyor" | "head";
      const base = role === "handler" ? 11 : role === "surveyor" ? 6 : 9;
      const n = Math.round(base * pace[p.id] * between(0.75, 1.25));
      const acts = ACTIONS[role];
      const total = acts.reduce((s, [, w]) => s + w, 0);
      for (let k = 0; k < n; k++) {
        const at = dayStart + between(9, 18) * HOUR;
        if (at > nowMs) continue;
        let x = r() * total;
        let action: string = acts[0][0];
        for (const [a, w] of acts) if ((x -= w) < 0) { action = a; break; }
        activity.push({ at: iso(at), actorId: p.id, role, action, claimId: `AXC-${20000 + Math.floor(r() * 6000)}` });
      }
    }
  }
  activity.sort((a, b) => a.at.localeCompare(b.at));
  return { version: 2, claims, activity };
}

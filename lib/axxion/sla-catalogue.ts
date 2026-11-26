/**
 * Axxion SLA catalogue: the 25 SLA clocks across five actors, as provided from
 * the backend catalogue (main/workflow/sla.py in the axxion repo). These are
 * the seeded defaults for all insurers; each can be overridden per reason and
 * per insurer in the Django admin. Live values were not checked.
 *
 * All windows count working time only: Monday to Saturday, 09:00–18:00 Dubai.
 */

export type SlaActor = "handler" | "surveyor" | "head" | "insurer" | "workshop";

export type SlaClock = {
  actor: SlaActor;
  title: string;
  /** Breach deadline in working hours, when it is a fixed number. */
  breachHours?: number;
  breachLabel: string;
  /** Reminder points in working hours before the breach, when fixed. */
  reminderHours?: number[];
  reminderLabel: string;
  /** Who receives the reminder. */
  remind: string;
  status?: "inactive";
  note?: string;
};

export const SLA_ACTORS: Record<SlaActor, { label: string; escalation: string; who: string }> = {
  handler: { label: "Claims handler", escalation: "CLAIMS ESCALATION", who: "Claims handlers" },
  surveyor: { label: "Surveyor", escalation: "SURVEY ESCALATION", who: "Surveyors" },
  head: { label: "Head of Claims", escalation: "CLAIMS ESCALATION", who: "Heads of Claims" },
  insurer: { label: "Insurer", escalation: "INSURER ESCALATION", who: "Insurers" },
  workshop: { label: "Workshop", escalation: "WORKSHOP ESCALATION", who: "Workshops (garages)" },
};

export const SLA_ACTOR_ORDER: SlaActor[] = ["handler", "surveyor", "head", "insurer", "workshop"];

/** Default quote window per insurer (Insurer.quote_sla_hours). */
export const DEFAULT_QUOTE_WINDOW_HOURS = 4;

const h = (n: number) => (n < 1 ? `${Math.round(n * 60)} min` : `${n} h`);

export const SLA_CLOCKS: SlaClock[] = [
  // Claims handler (7)
  { actor: "handler", title: "Preferred repair location not recorded", breachHours: 6, breachLabel: h(6), reminderHours: [3], reminderLabel: h(3), remind: "Handler" },
  { actor: "handler", title: "Surveyor not assigned (auto-assignment found nobody)", breachHours: 0.5, breachLabel: h(0.5), reminderHours: [10 / 60], reminderLabel: "10 min", remind: "Handler" },
  { actor: "handler", title: "Customer drop-off not arranged", breachHours: 48, breachLabel: h(48), reminderHours: [24], reminderLabel: h(24), remind: "Handler" },
  { actor: "handler", title: "Quality check not scheduled", breachHours: 48, breachLabel: h(48), reminderHours: [6], reminderLabel: h(6), remind: "Surveyor" },
  { actor: "handler", title: "Customer not notified to schedule pickup", breachHours: 24, breachLabel: h(24), reminderHours: [12], reminderLabel: h(12), remind: "Handler" },
  { actor: "handler", title: "Flagged invoice not resolved", breachHours: 48, breachLabel: h(48), reminderHours: [24], reminderLabel: h(24), remind: "Handler" },
  { actor: "handler", title: "Replacement garage not picked (top-up found nobody)", breachHours: 1, breachLabel: "60 min", reminderHours: [0.5], reminderLabel: h(0.5), remind: "Handler" },

  // Surveyor (4)
  { actor: "surveyor", title: "Initial survey not submitted", breachHours: 1, breachLabel: "60 min", reminderHours: [0.5], reminderLabel: h(0.5), remind: "Surveyor" },
  { actor: "surveyor", title: "Survey & negotiation not ready after quotes came in", breachHours: 24, breachLabel: h(24), reminderHours: [12], reminderLabel: h(12), remind: "Surveyor" },
  { actor: "surveyor", title: "Quality check not performed", breachHours: 48, breachLabel: h(48), reminderHours: [24], reminderLabel: h(24), remind: "Surveyor" },
  { actor: "surveyor", title: "QC sent back, corrections not resubmitted", breachHours: 24, breachLabel: h(24), reminderHours: [12], reminderLabel: h(12), remind: "Surveyor" },

  // Head of Claims (4)
  { actor: "head", title: "Survey not signed off", breachHours: 24, breachLabel: h(24), reminderHours: [12], reminderLabel: h(12), remind: "Head of Claims" },
  { actor: "head", title: "Garage award not decided", breachHours: 24, breachLabel: h(24), reminderHours: [12], reminderLabel: h(12), remind: "Head of Claims" },
  { actor: "head", title: "Quality check not verified", breachHours: 24, breachLabel: h(24), reminderHours: [12], reminderLabel: h(12), remind: "Head of Claims" },
  { actor: "head", title: "Fraud review not decided", breachHours: 24, breachLabel: h(24), reminderHours: [12], reminderLabel: h(12), remind: "Head of Claims" },

  // Insurer (2)
  { actor: "insurer", title: "LPO not received", breachHours: 72, breachLabel: h(72), reminderHours: [24, 48], reminderLabel: "24 h and 48 h", remind: "Handler" },
  {
    actor: "insurer",
    title: "Total-loss decision not received",
    breachHours: 72,
    breachLabel: h(72),
    reminderHours: [24, 48],
    reminderLabel: "24 h and 48 h",
    remind: "Handler",
    status: "inactive",
    note: "The policy exists but nothing starts its clock yet, so it never fires.",
  },

  // Workshop (8)
  {
    actor: "workshop",
    title: "Quote not submitted",
    breachHours: 3 * DEFAULT_QUOTE_WINDOW_HOURS,
    breachLabel: `3 quote windows (${3 * DEFAULT_QUOTE_WINDOW_HOURS} h by default)`,
    reminderHours: [DEFAULT_QUOTE_WINDOW_HOURS, 2 * DEFAULT_QUOTE_WINDOW_HOURS],
    reminderLabel: `1 and 2 windows (${DEFAULT_QUOTE_WINDOW_HOURS} h and ${2 * DEFAULT_QUOTE_WINDOW_HOURS} h)`,
    remind: "Garage",
    note: "The quote window is set per insurer (default 4 working hours).",
  },
  { actor: "workshop", title: "Start and completion dates not entered", breachHours: 24, breachLabel: h(24), reminderHours: [12], reminderLabel: h(12), remind: "Garage" },
  { actor: "workshop", title: "Car not confirmed as received", breachHours: 24, breachLabel: h(24), reminderHours: [12], reminderLabel: h(12), remind: "Garage" },
  { actor: "workshop", title: "Purchased-parts list not uploaded", breachHours: 48, breachLabel: h(48), reminderHours: [24], reminderLabel: h(24), remind: "Garage" },
  { actor: "workshop", title: "Repair not completed by expected date", breachLabel: "The repair's own expected date", reminderLabel: "24 h before the deadline", remind: "Garage" },
  { actor: "workshop", title: "Rework after failed QC not requested", breachHours: 48, breachLabel: h(48), reminderHours: [24], reminderLabel: h(24), remind: "Garage" },
  { actor: "workshop", title: "Customer pickup not confirmed", breachLabel: "The case's own pickup window", reminderLabel: "6 h", remind: "Handler" },
  { actor: "workshop", title: "Final invoice not uploaded", breachHours: 72, breachLabel: h(72), reminderHours: [24, 48], reminderLabel: "24 h and 48 h", remind: "Garage" },
];

export const SLA_NOTES: { title: string; body: string; tone?: "info" | "warn" | "planned" }[] = [
  {
    title: "Working time only",
    body: "Every window counts working time only: Monday to Saturday, 09:00–18:00 Dubai. A 24 h SLA is 24 working hours, not one calendar day.",
  },
  {
    title: "Quote window",
    body: "Set per insurer (Insurer.quote_sla_hours), 4 working hours by default, so the default quote breach lands at 12 working hours.",
  },
  {
    title: "Total-loss decision never fires yet",
    body: "The policy exists, but nothing starts its clock yet.",
    tone: "warn",
  },
  {
    title: "Reminders are not breaches",
    body: "Only the deadline passing records a breach and escalates. An insurer with mute_sla_emails on still gets everything recorded, with no emails sent.",
  },
  {
    title: "Statutory timers are planned",
    body: "Statutory timers such as the 15-day clock are planned, not built.",
    tone: "planned",
  },
  {
    title: "Where breaches are shown",
    body: "Recorded breaches are on the /sla page in the staff app (super-user only). This page is a reference of the clocks themselves.",
  },
  {
    title: "Defaults, not live values",
    body: "These are the seeded defaults for all insurers. Each can be overridden per reason and per insurer in the Django admin; the live values were not checked.",
    tone: "warn",
  },
];

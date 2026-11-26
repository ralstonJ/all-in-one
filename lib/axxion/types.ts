import type { AxRole } from "@/lib/axxion/token";
import type { Emirate } from "@/lib/axxion/accounts";

/** ClaimOS workflow steps. Each open step runs one SLA clock (see workflow.ts). */
export type Stage =
  | "assign_surveyor"
  | "initial_survey"
  | "repair_location"
  | "quotes"
  | "replacement_garage"
  | "survey_negotiation"
  | "survey_signoff"
  | "fraud_review"
  | "garage_award"
  | "lpo"
  | "dropoff"
  | "car_received"
  | "repair_dates"
  | "parts_list"
  | "repair"
  | "qc_schedule"
  | "qc_perform"
  | "qc_verify"
  | "qc_corrections"
  | "rework"
  | "notify_pickup"
  | "pickup"
  | "final_invoice"
  | "invoice_flagged"
  | "closed"
  | "rejected";

export type Quote = {
  workshopId: string;
  amount: number; // AED
  days: number;
  submittedAt: string;
};

export type ClaimEvent = { at: string; actorId: string; action: string; note?: string };

export type Claim = {
  id: string;
  insurer: string;
  policyNo: string;
  insured: string;
  phone: string;
  emirate: Emirate;
  vehicle: { make: string; model: string; year: number; plate: string };
  incident: string;
  incidentDate: string;
  createdAt: string;
  handlerId: string;
  surveyorId?: string;

  stage: Stage;
  stageSince: string;
  /** SLA breach time for the current step (working time already applied). */
  dueAt: string;

  estimate?: number;
  surveyNotes?: string;
  fraudFlag?: boolean;
  preferredLocation?: string;

  quoteRequestedAt?: string;
  quoteDueAt?: string;
  invited: string[];
  quotes: Quote[];
  negotiationNotes?: string;
  signedOffBy?: string;
  awardedWorkshopId?: string;

  lpoAt?: string;
  dropoffAt?: string;
  carReceivedAt?: string;
  repairStart?: string;
  expectedCompletion?: string;
  partsList?: string;
  repairDoneAt?: string;
  qcScheduledAt?: string;
  qcResult?: { passed: boolean; notes: string; at: string };
  qcVerifiedAt?: string;
  reworkCount: number;
  pickupBy?: string;
  pickedUpAt?: string;
  invoiceAmount?: number;
  invoiceFlag?: string;
  closedAt?: string;
  rejectedReason?: string;

  events: ClaimEvent[];
};

/** One completed piece of work, used for the admin's daily/weekly/monthly view. */
export type Activity = { at: string; actorId: string; role: AxRole; action: string; claimId: string };

export type AxStore = { version: 2; claims: Claim[]; activity: Activity[] };

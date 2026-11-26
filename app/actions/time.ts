"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, toViewer } from "@/lib/auth";
import { getPerson } from "@/lib/org";
import {
  clock,
  createApproval,
  dateKey,
  decide,
  type LeaveKind,
} from "@/lib/time-store";

export type FormState = { ok?: string; error?: string };

function refresh() {
  revalidatePath("/", "layout");
}

export async function clockAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.person) return;
  const type = formData.get("type") === "out" ? "out" : "in";
  clock(user.person.id, type);
  refresh();
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;

export async function submitRequest(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in again." };
  if (!user.person) return { error: "This account isn't linked to anyone on the org chart." };
  const manager = user.person.reportsTo ? getPerson(user.person.reportsTo) : undefined;
  if (!manager) return { error: "You're at the top of the chart, so there is no one to approve this." };

  const str = (key: string, max = 300) => String(formData.get(key) ?? "").trim().slice(0, max);
  const type = str("type");
  const date = str("date");
  const reason = str("reason");
  const today = dateKey(new Date());
  if (!DATE.test(date)) return { error: "Pick a date." };
  if (!reason) return { error: "Add a short reason." };

  const money = (key: string, required: boolean): number | undefined | string => {
    const raw = str(key);
    if (!raw) return required ? "Enter an amount." : undefined;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0 || n > 1_000_000) return "Enter a valid amount.";
    return Math.round(n * 100) / 100;
  };
  const base = { personId: user.person.id, date, reason };

  switch (type) {
    case "correction": {
      const clockIn = str("clockIn");
      const clockOut = str("clockOut");
      if (date > today) return { error: "A missed clock can't be in the future." };
      if (!TIME.test(clockIn) && !TIME.test(clockOut))
        return { error: "Enter the clock-in time, the clock-out time, or both." };
      if (TIME.test(clockIn) && TIME.test(clockOut) && clockOut <= clockIn)
        return { error: "Clock-out must be after clock-in." };
      createApproval({
        ...base,
        type,
        clockIn: TIME.test(clockIn) ? clockIn : undefined,
        clockOut: TIME.test(clockOut) ? clockOut : undefined,
      });
      break;
    }
    case "overtime": {
      const hours = Number(formData.get("hours"));
      if (!Number.isFinite(hours) || hours < 0.5 || hours > 12)
        return { error: "Overtime must be between 0.5 and 12 hours." };
      createApproval({ ...base, type, hours });
      break;
    }
    case "leave":
    case "travel": {
      const endDate = str("endDate") || date;
      if (!DATE.test(endDate) || endDate < date)
        return { error: "The end date must be on or after the start date." };
      if (type === "leave") {
        const kind = str("leaveKind");
        if (!["Annual", "Sick", "Unpaid"].includes(kind)) return { error: "Pick a leave type." };
        createApproval({ ...base, type, endDate, leaveKind: kind as LeaveKind });
      } else {
        const destination = str("destination", 80);
        if (!destination) return { error: "Where are you travelling to?" };
        const amount = money("amount", true);
        if (typeof amount === "string") return { error: amount };
        createApproval({ ...base, type, endDate, destination, amount });
      }
      break;
    }
    case "parts":
    case "equipment": {
      const item = str("item", 120);
      if (!item) return { error: `What ${type === "parts" ? "part" : "equipment"} do you need?` };
      const quantity = Math.floor(Number(formData.get("quantity")));
      if (!Number.isFinite(quantity) || quantity < 1 || quantity > 999)
        return { error: "Quantity must be between 1 and 999." };
      const amount = money("amount", true);
      if (typeof amount === "string") return { error: amount };
      createApproval({
        ...base,
        type,
        item,
        quantity,
        amount,
        reference: type === "parts" ? str("reference", 80) || undefined : undefined,
      });
      break;
    }
    case "expense": {
      const item = str("item", 120);
      if (!item) return { error: "What was the expense for?" };
      if (date > today) return { error: "An expense date can't be in the future." };
      const amount = money("amount", true);
      if (typeof amount === "string") return { error: amount };
      if (!amount) return { error: "Enter an amount." };
      const category = str("category", 40) || "Other";
      createApproval({ ...base, type, item, amount, category });
      break;
    }
    default:
      return { error: "Pick a request type." };
  }

  refresh();
  return { ok: `Sent to ${manager.name} for approval.` };
}

export async function decideAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const id = String(formData.get("id") ?? "");
  const decision = formData.get("decision") === "approved" ? "approved" : "rejected";
  const note = String(formData.get("note") ?? "").trim().slice(0, 300);
  decide(id, decision, toViewer(user), note);
  refresh();
}

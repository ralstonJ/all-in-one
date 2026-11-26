"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AX_PASSWORD_HASH, findAxAccountByUsername } from "@/lib/axxion/accounts";
import { createAxSession, destroyAxSession, getAxUser } from "@/lib/axxion/session";
import { act, type ActionInput } from "@/lib/axxion/store";

export type AxLoginState = { error?: string; username?: string };
export type AxActionState = { error?: string; ok?: string };

export async function axLogin(_prev: AxLoginState, formData: FormData): Promise<AxLoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");
  if (!username || !password) return { error: "Enter your username and password.", username };
  const account = findAxAccountByUsername(username);
  const ok = account ? await bcrypt.compare(password, AX_PASSWORD_HASH) : false;
  if (!account || !ok) return { error: "Incorrect username or password.", username };
  await createAxSession(account);
  redirect(next.startsWith("/axxion/") && !next.startsWith("/axxion/login") ? next : "/axxion/home");
}

export async function axLogout() {
  await destroyAxSession();
  redirect("/axxion/login");
}

const num = (v: FormDataEntryValue | null) => Number(String(v ?? "").replace(/,/g, ""));
const text = (v: FormDataEntryValue | null, max = 500) => String(v ?? "").trim().slice(0, max);

/** Every claim action goes through here; the store re-checks role, access and step. */
export async function axAction(_prev: AxActionState, formData: FormData): Promise<AxActionState> {
  const user = await getAxUser();
  if (!user) return { error: "Your session has ended. Please sign in again." };
  const claimId = text(formData.get("claimId"), 40);
  const type = text(formData.get("type"), 40);
  const f = (k: string, max = 500) => text(formData.get(k), max);

  let input: ActionInput;
  switch (type) {
    case "assignSurveyor":
      input = { type, surveyorId: f("surveyorId", 40) };
      break;
    case "initialSurvey":
      input = { type, estimate: num(formData.get("estimate")), notes: f("notes", 1000), fraud: formData.get("fraud") === "on" };
      break;
    case "repairLocation":
      input = { type, location: f("location", 120) };
      break;
    case "submitQuote":
      input = { type, amount: num(formData.get("amount")), days: num(formData.get("days")) };
      break;
    case "pickReplacement":
    case "awardGarage":
      input = { type, workshopId: f("workshopId", 40) };
      break;
    case "surveyNegotiation":
      input = { type, notes: f("notes", 1000) };
      break;
    case "fraudDecision":
      input = { type, decision: formData.get("decision") === "reject" ? "reject" : "clear", note: f("note", 300) || undefined };
      break;
    case "dropoff":
    case "scheduleQc":
      input = { type, when: f("when", 20) };
      break;
    case "repairDates":
      input = { type, start: f("start", 10), end: f("end", 10) };
      break;
    case "partsList":
      input = { type, list: f("list", 1000) };
      break;
    case "performQc":
      input = { type, passed: formData.get("result") === "pass", notes: f("notes", 1000) };
      break;
    case "verifyQc":
      input = { type, decision: formData.get("decision") === "sendBack" ? "sendBack" : "verify", note: f("note", 300) || undefined };
      break;
    case "qcCorrections":
      input = { type, notes: f("notes", 1000) };
      break;
    case "notifyPickup":
      input = { type, by: f("by", 10) };
      break;
    case "finalInvoice":
      input = { type, amount: num(formData.get("amount")) };
      break;
    case "resolveInvoice":
      input = { type, note: f("note", 300) || undefined };
      break;
    case "signOff":
    case "lpoReceived":
    case "carReceived":
    case "repairDone":
    case "requestRework":
    case "confirmPickup":
    case "remind":
      input = { type };
      break;
    default:
      return { error: "Unknown action." };
  }

  const result = act(user, claimId, input);
  if (result.error) return { error: result.error };
  revalidatePath("/axxion", "layout");
  return { ok: type === "remind" ? "Reminder sent." : "Done." };
}

/** Send a manual reminder on every claim in a group (admin and heads). */
export async function axRemindMany(_prev: AxActionState, formData: FormData): Promise<AxActionState> {
  const user = await getAxUser();
  if (!user) return { error: "Your session has ended. Please sign in again." };
  if (user.role !== "admin" && user.role !== "head") return { error: "Only admins and heads can remind a whole group." };
  const ids = String(formData.get("claimIds") ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 200);
  let sent = 0;
  for (const id of ids) if (!act(user, id, { type: "remind" }).error) sent++;
  revalidatePath("/axxion", "layout");
  return sent ? { ok: `Sent ${sent} reminder${sent === 1 ? "" : "s"}.` } : { error: "Nothing to remind." };
}

import { accountsByRole, getAxAccount, type AxAccount } from "@/lib/axxion/accounts";
import type { Claim } from "@/lib/axxion/types";
import { isMyTurn } from "@/lib/axxion/workflow";
import { ActionForm } from "@/components/axxion/action-form";
import { money } from "@/components/axxion/ui";

const input =
  "rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";
const primary = "rounded-lg bg-[#0b1f3a] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#11305a] disabled:opacity-60";
const green = "rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60";
const ghost = "rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60";
const label = "block text-xs font-medium text-slate-600";

/** Today in Dubai as YYYY-MM-DD, for date inputs. */
function dubaiToday() {
  return new Date(Date.now() + 4 * 3600_000).toISOString().slice(0, 10);
}

function Button({ claim, type, text, tone = "primary" }: { claim: Claim; type: string; text: string; tone?: "primary" | "green" }) {
  return (
    <ActionForm claimId={claim.id} type={type} className="flex flex-wrap items-center gap-2">
      <button className={tone === "green" ? green : primary}>{text}</button>
    </ActionForm>
  );
}

export function QuoteForm({ claim }: { claim: Claim }) {
  return (
    <ActionForm claimId={claim.id} type="submitQuote" className="flex flex-wrap items-end gap-2">
      <label className="text-xs text-slate-500">
        Quote (AED)
        <input name="amount" type="number" min="1" step="1" required className={`${input} mt-0.5 block w-32`} />
      </label>
      <label className="text-xs text-slate-500">
        Repair days
        <input name="days" type="number" min="1" max="60" required className={`${input} mt-0.5 block w-24`} />
      </label>
      <button className={primary}>Submit quote</button>
    </ActionForm>
  );
}

function QuotePicker({ claim, type, text }: { claim: Claim; type: "awardGarage"; text: string }) {
  const sorted = [...claim.quotes].sort((a, b) => a.amount - b.amount);
  if (!sorted.length) return <p className="text-sm text-rose-700">No quotes on this claim.</p>;
  return (
    <ActionForm claimId={claim.id} type={type} className="space-y-2">
      <fieldset className="space-y-1.5">
        <legend className="sr-only">Pick the garage</legend>
        {sorted.map((q, i) => (
          <label key={q.workshopId} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50">
            <input type="radio" name="workshopId" value={q.workshopId} defaultChecked={i === 0} required className="accent-teal-600" />
            <span className="flex-1 font-medium text-slate-900">{getAxAccount(q.workshopId)?.name}</span>
            <span className="tabular-nums">{money(q.amount)}</span>
            <span className="w-16 text-right text-slate-500">{q.days} days</span>
            {i === 0 && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">Lowest</span>}
          </label>
        ))}
      </fieldset>
      <button className={primary}>{text}</button>
    </ActionForm>
  );
}

/** The action for the claim's current step, if it is this user's turn. */
export function StageAction({ claim, user, compact = false }: { claim: Claim; user: AxAccount; compact?: boolean }) {
  if (!isMyTurn(user, claim)) return null;
  const today = dubaiToday();
  switch (claim.stage) {
    case "assign_surveyor": {
      const local = accountsByRole("surveyor").sort((a, b) => Number(b.emirate === claim.emirate) - Number(a.emirate === claim.emirate));
      return (
        <ActionForm claimId={claim.id} type="assignSurveyor" className="flex flex-wrap items-center gap-2">
          <select name="surveyorId" required aria-label="Surveyor" className={input}>
            {local.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.emirate}
              </option>
            ))}
          </select>
          <button className={primary}>Assign surveyor</button>
        </ActionForm>
      );
    }
    case "initial_survey":
      return (
        <ActionForm claimId={claim.id} type="initialSurvey" className="space-y-3">
          <label className={label}>
            Estimate (AED)
            <input name="estimate" type="number" min="1" step="1" required className={`${input} mt-1 block w-48`} />
          </label>
          <label className={label}>
            Survey notes
            <textarea name="notes" rows={compact ? 2 : 3} required maxLength={1000} className={`${input} mt-1 block w-full`} />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="fraud" className="h-4 w-4 accent-rose-600" /> Flag for fraud review
          </label>
          <button className={primary}>Submit initial survey</button>
        </ActionForm>
      );
    case "repair_location":
      return (
        <ActionForm claimId={claim.id} type="repairLocation" className="flex flex-wrap items-center gap-2">
          <input name="location" required maxLength={120} placeholder={`e.g. Al Quoz, ${claim.emirate}`} aria-label="Preferred repair location" className={`${input} min-w-0 flex-1`} />
          <button className={primary}>Record location</button>
        </ActionForm>
      );
    case "quotes":
      return <QuoteForm claim={claim} />;
    case "replacement_garage": {
      const options = accountsByRole("workshop").filter((w) => !claim.invited.includes(w.id));
      return (
        <ActionForm claimId={claim.id} type="pickReplacement" className="flex flex-wrap items-center gap-2">
          <select name="workshopId" required aria-label="Replacement garage" className={input}>
            {options
              .sort((a, b) => Number(b.emirate === claim.emirate) - Number(a.emirate === claim.emirate))
              .map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} · {w.emirate}
                </option>
              ))}
          </select>
          <button className={primary}>Pick garage and request a quote</button>
        </ActionForm>
      );
    }
    case "survey_negotiation":
      return (
        <ActionForm claimId={claim.id} type="surveyNegotiation" className="space-y-2">
          <textarea name="notes" rows={compact ? 2 : 3} required maxLength={1000} placeholder="Negotiation with the garages, agreed labour and parts" aria-label="Negotiation notes" className={`${input} block w-full`} />
          <button className={primary}>Submit survey & negotiation</button>
        </ActionForm>
      );
    case "survey_signoff":
      return <Button claim={claim} type="signOff" text="Sign off the survey" tone="green" />;
    case "fraud_review":
      return (
        <ActionForm claimId={claim.id} type="fraudDecision" className="flex flex-wrap items-center gap-2">
          <input name="note" maxLength={300} placeholder="Note (optional)" aria-label={`Fraud review note for ${claim.id}`} className={`${input} min-w-0 flex-1`} />
          <button name="decision" value="clear" className={green}>Clear</button>
          <button name="decision" value="reject" className={ghost}>Reject claim</button>
        </ActionForm>
      );
    case "garage_award":
      return <QuotePicker claim={claim} type="awardGarage" text="Award garage" />;
    case "lpo":
      return <Button claim={claim} type="lpoReceived" text={`LPO received from ${claim.insurer}`} />;
    case "dropoff":
      return (
        <ActionForm claimId={claim.id} type="dropoff" className="flex flex-wrap items-center gap-2">
          <input name="when" type="datetime-local" required min={`${today}T09:00`} aria-label="Drop-off date and time" className={input} />
          <button className={primary}>Arrange drop-off</button>
        </ActionForm>
      );
    case "car_received":
      return <Button claim={claim} type="carReceived" text="Car received" tone="green" />;
    case "repair_dates":
      return (
        <ActionForm claimId={claim.id} type="repairDates" className="flex flex-wrap items-end gap-2">
          <label className="text-xs text-slate-500">
            Start
            <input name="start" type="date" required min={today} className={`${input} mt-0.5 block`} />
          </label>
          <label className="text-xs text-slate-500">
            Completion
            <input name="end" type="date" required min={today} className={`${input} mt-0.5 block`} />
          </label>
          <button className={primary}>Save dates</button>
        </ActionForm>
      );
    case "parts_list":
      return (
        <ActionForm claimId={claim.id} type="partsList" className="space-y-2">
          <textarea name="list" rows={2} required maxLength={1000} placeholder="Purchased parts, one per line" aria-label="Purchased parts list" className={`${input} block w-full`} />
          <button className={primary}>Upload parts list</button>
        </ActionForm>
      );
    case "repair":
      return <Button claim={claim} type="repairDone" text="Repair completed" tone="green" />;
    case "qc_schedule":
      return (
        <ActionForm claimId={claim.id} type="scheduleQc" className="flex flex-wrap items-center gap-2">
          <input name="when" type="datetime-local" required min={`${today}T09:00`} aria-label="Quality check date and time" className={input} />
          <button className={primary}>Schedule QC</button>
        </ActionForm>
      );
    case "qc_perform":
      return (
        <ActionForm claimId={claim.id} type="performQc" className="space-y-2">
          <textarea name="notes" rows={2} required maxLength={1000} placeholder="QC findings" aria-label="QC notes" className={`${input} block w-full`} />
          <div className="flex gap-2">
            <button name="result" value="pass" className={green}>QC passed</button>
            <button name="result" value="fail" className={ghost}>QC failed: rework</button>
          </div>
        </ActionForm>
      );
    case "qc_verify":
      return (
        <ActionForm claimId={claim.id} type="verifyQc" className="flex flex-wrap items-center gap-2">
          <input name="note" maxLength={300} placeholder="Note (optional)" aria-label={`QC note for ${claim.id}`} className={`${input} min-w-0 flex-1`} />
          <button name="decision" value="verify" className={green}>Verify QC</button>
          <button name="decision" value="sendBack" className={ghost}>Send back</button>
        </ActionForm>
      );
    case "qc_corrections":
      return (
        <ActionForm claimId={claim.id} type="qcCorrections" className="space-y-2">
          <textarea name="notes" rows={2} required maxLength={1000} placeholder="What was corrected" aria-label="QC corrections" className={`${input} block w-full`} />
          <button className={primary}>Resubmit QC</button>
        </ActionForm>
      );
    case "rework":
      return <Button claim={claim} type="requestRework" text="Request rework" />;
    case "notify_pickup":
      return (
        <ActionForm claimId={claim.id} type="notifyPickup" className="flex flex-wrap items-center gap-2">
          <label className="text-xs text-slate-500">
            Pickup by
            <input name="by" type="date" required min={today} className={`${input} ml-2`} />
          </label>
          <button className={primary}>Customer notified</button>
        </ActionForm>
      );
    case "pickup":
      return <Button claim={claim} type="confirmPickup" text="Customer picked up the car" tone="green" />;
    case "final_invoice":
      return (
        <ActionForm claimId={claim.id} type="finalInvoice" className="flex flex-wrap items-end gap-2">
          <label className="text-xs text-slate-500">
            Invoice total (AED)
            <input name="amount" type="number" min="1" step="1" required className={`${input} mt-0.5 block w-36`} />
          </label>
          <button className={primary}>Upload final invoice</button>
        </ActionForm>
      );
    case "invoice_flagged":
      return (
        <ActionForm claimId={claim.id} type="resolveInvoice" className="flex flex-wrap items-center gap-2">
          <input name="note" maxLength={300} placeholder="How it was resolved" aria-label="Resolution" className={`${input} min-w-0 flex-1`} />
          <button className={green}>Resolve and close</button>
        </ActionForm>
      );
    default:
      return null;
  }
}

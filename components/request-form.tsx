"use client";

import { useActionState, useState } from "react";
import { submitRequest, type FormState } from "@/app/actions/time";
import { EXPENSE_CATEGORIES, TYPE_LABEL } from "@/lib/requests";
import type { ApprovalType } from "@/lib/time-store";

const input =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200";
const label = "block text-xs font-medium uppercase tracking-wide text-slate-500";

function Field({ id, text, children }: { id: string; text: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className={label}>
        {text}
      </label>
      {children}
    </div>
  );
}

export function RequestForm({
  types,
  today,
  managerName,
}: {
  types: ApprovalType[];
  today: string;
  managerName: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitRequest, {});
  const [type, setType] = useState<ApprovalType>(types[0]);
  const [formKey, setFormKey] = useState(0);

  const pastOnly = type === "correction" || type === "overtime" || type === "expense";
  const hasRange = type === "leave" || type === "travel";
  const dateLabel =
    type === "parts" || type === "equipment"
      ? "Needed by"
      : type === "expense"
        ? "Date spent"
        : hasRange
          ? "From"
          : "Date";

  return (
    <form
      key={formKey}
      action={action}
      className="space-y-4"
    >
      <div
        role="radiogroup"
        aria-label="Request type"
        className={`grid gap-1 rounded-lg border border-slate-300 p-1 ${types.length > 3 ? "grid-cols-3 sm:grid-cols-5 lg:grid-cols-3" : "grid-cols-3"}`}
      >
        {types.map((value) => (
          <label
            key={value}
            className={`cursor-pointer rounded-md px-2 py-1.5 text-center text-xs font-medium transition ${
              type === value ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <input
              type="radio"
              name="type"
              value={value}
              checked={type === value}
              onChange={() => {
                setType(value);
                setFormKey((k) => k + 1);
              }}
              className="sr-only"
            />
            {TYPE_LABEL[value]}
          </label>
        ))}
      </div>

      {(type === "parts" || type === "equipment" || type === "expense") && (
        <Field id="req-item" text={type === "expense" ? "What was it for" : type === "parts" ? "Part" : "Item"}>
          <input id="req-item" name="item" required maxLength={120} className={input} />
        </Field>
      )}

      {type === "travel" && (
        <Field id="req-dest" text="Destination">
          <input id="req-dest" name="destination" required maxLength={80} className={input} />
        </Field>
      )}

      {(type === "parts" || type === "equipment") && (
        <div className="grid grid-cols-2 gap-3">
          <Field id="req-qty" text="Quantity">
            <input id="req-qty" name="quantity" type="number" min="1" max="999" defaultValue="1" required className={input} />
          </Field>
          <Field id="req-amount" text="Est. cost (AED)">
            <input id="req-amount" name="amount" type="number" min="0" step="0.01" required className={input} />
          </Field>
        </div>
      )}

      {type === "parts" && (
        <Field id="req-ref" text="Job card / vehicle (optional)">
          <input id="req-ref" name="reference" maxLength={80} className={input} />
        </Field>
      )}

      {type === "expense" && (
        <div className="grid grid-cols-2 gap-3">
          <Field id="req-amount" text="Amount (AED)">
            <input id="req-amount" name="amount" type="number" min="0.01" step="0.01" required className={input} />
          </Field>
          <Field id="req-cat" text="Category">
            <select id="req-cat" name="category" defaultValue="Tools" className={input}>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
        </div>
      )}

      <div className={hasRange ? "grid grid-cols-2 gap-3" : ""}>
        <Field id="req-date" text={dateLabel}>
          <input
            id="req-date"
            name="date"
            type="date"
            required
            defaultValue={today}
            max={pastOnly ? today : undefined}
            min={pastOnly ? undefined : type === "leave" || type === "travel" || type === "parts" || type === "equipment" ? today : undefined}
            className={input}
          />
        </Field>
        {hasRange && (
          <Field id="req-end" text="To">
            <input id="req-end" name="endDate" type="date" defaultValue={today} min={today} className={input} />
          </Field>
        )}
      </div>

      {type === "travel" && (
        <Field id="req-amount" text="Est. cost (AED)">
          <input id="req-amount" name="amount" type="number" min="0" step="0.01" required className={input} />
        </Field>
      )}

      {type === "correction" && (
        <div className="grid grid-cols-2 gap-3">
          <Field id="req-in" text="Clock in">
            <input id="req-in" name="clockIn" type="time" className={input} />
          </Field>
          <Field id="req-out" text="Clock out">
            <input id="req-out" name="clockOut" type="time" className={input} />
          </Field>
        </div>
      )}

      {type === "overtime" && (
        <Field id="req-hours" text="Hours">
          <input id="req-hours" name="hours" type="number" min="0.5" max="12" step="0.5" defaultValue="1" className={input} />
        </Field>
      )}

      {type === "leave" && (
        <Field id="req-kind" text="Leave type">
          <select id="req-kind" name="leaveKind" defaultValue="Annual" className={input}>
            <option>Annual</option>
            <option>Sick</option>
            <option>Unpaid</option>
          </select>
        </Field>
      )}

      <Field id="req-reason" text={type === "travel" ? "Purpose" : "Reason"}>
        <textarea id="req-reason" name="reason" rows={2} required maxLength={300} className={input} />
      </Field>

      {state.error && (
        <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </p>
      )}
      {state.ok && !pending && (
        <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {state.ok}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Sending…" : `Send to ${managerName}`}
      </button>
    </form>
  );
}

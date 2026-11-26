"use client";

import { useActionState, useState } from "react";
import { saveSopAction, type SopFormState } from "@/app/actions/sops";
import { Markdown } from "@/components/markdown";

const input =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200";
const label = "block text-xs font-medium uppercase tracking-wide text-slate-500";

const STARTER = `## Purpose
Why this procedure exists.

## Steps
1. First step
2. Second step

## Checks
- [ ] Item to confirm
`;

export function SopEditor({
  sop,
  departments,
  lockedDepartments = [],
  defaultDepartment,
}: {
  sop?: { id: string; title: string; summary: string; body: string; departments: string[] };
  /** Departments this user can publish to. */
  departments: string[];
  /** Departments already on the SOP that this user can't change. */
  lockedDepartments?: string[];
  defaultDepartment?: string;
}) {
  const [state, action, pending] = useActionState<SopFormState, FormData>(saveSopAction, {});
  const [body, setBody] = useState(sop?.body ?? STARTER);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const initial = new Set(sop?.departments ?? (defaultDepartment ? [defaultDepartment] : []));

  return (
    <form action={action} className="space-y-5">
      {sop && <input type="hidden" name="id" value={sop.id} />}

      <div>
        <label htmlFor="sop-title" className={label}>Title</label>
        <input id="sop-title" name="title" required maxLength={120} defaultValue={sop?.title} className={input} />
      </div>

      <div>
        <label htmlFor="sop-summary" className={label}>One-line summary</label>
        <input id="sop-summary" name="summary" maxLength={240} defaultValue={sop?.summary} className={input} />
      </div>

      <fieldset>
        <legend className={label}>Departments that can see it</legend>
        <p className="mt-1 text-xs text-slate-500">
          Pick more than one to share it between teams you lead. Their managers can also see it.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {departments.map((d) => (
            <label
              key={d}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm has-[:checked]:border-slate-900 has-[:checked]:bg-slate-900 has-[:checked]:text-white"
            >
              <input type="checkbox" name="departments" value={d} defaultChecked={initial.has(d)} className="sr-only" />
              {d}
            </label>
          ))}
          {lockedDepartments.map((d) => (
            <span
              key={d}
              title="Already on this SOP; only its leaders can remove it"
              className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-sm text-slate-500"
            >
              {d} (kept)
            </span>
          ))}
        </div>
      </fieldset>

      <div>
        <div className="flex items-center justify-between">
          <span className={label}>Procedure</span>
          <div role="tablist" className="flex rounded-lg border border-slate-300 p-0.5 text-xs font-medium">
            {(["write", "preview"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`rounded-md px-3 py-1 capitalize ${tab === t ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <textarea
          name="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={18}
          maxLength={20000}
          aria-label="Procedure (Markdown)"
          className={`${input} font-mono ${tab === "write" ? "" : "hidden"}`}
        />
        {tab === "preview" && (
          <div className="mt-1 min-h-[18rem] rounded-lg border border-slate-200 bg-slate-50 p-4">
            <Markdown>{body || "_Nothing written yet._"}</Markdown>
          </div>
        )}
        <p className="mt-1 text-xs text-slate-500">
          Markdown: <code>## Heading</code>, <code>1. step</code>, <code>- bullet</code>, <code>- [ ] check</code>,{" "}
          <code>**bold**</code>, <code>&gt; warning</code>.
        </p>
      </div>

      {state.error && (
        <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Saving…" : sop ? "Save changes" : "Publish SOP"}
      </button>
    </form>
  );
}

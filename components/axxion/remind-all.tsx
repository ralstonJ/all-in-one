"use client";

import { useActionState } from "react";
import { Bell } from "lucide-react";
import { axRemindMany, type AxActionState } from "@/app/actions/axxion";

/** Manual reminder on a whole group. Breaches have already escalated automatically. */
export function RemindAll({ claimIds }: { claimIds: string[] }) {
  const [state, action, pending] = useActionState<AxActionState, FormData>(axRemindMany, {});
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(`Send a reminder on ${claimIds.length} claims?`)) e.preventDefault();
      }}
      className="flex items-center gap-2"
    >
      <input type="hidden" name="claimIds" value={claimIds.join(",")} />
      <button
        disabled={pending || claimIds.length === 0}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      >
        <Bell className="h-4 w-4" aria-hidden /> {pending ? "Sending…" : `Remind all ${claimIds.length}`}
      </button>
      {state.ok && <span className="text-xs font-medium text-emerald-700">{state.ok}</span>}
      {state.error && <span className="text-xs text-rose-700">{state.error}</span>}
    </form>
  );
}

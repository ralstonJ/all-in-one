"use client";

import { useActionState } from "react";
import { axAction, type AxActionState } from "@/app/actions/axxion";

/**
 * Wraps any claim action form: posts to the single server action and shows
 * its error or confirmation. Children supply the inputs and submit buttons.
 */
export function ActionForm({
  claimId,
  type,
  children,
  className = "",
  hideOk = false,
}: {
  claimId: string;
  type?: string;
  children: React.ReactNode;
  className?: string;
  hideOk?: boolean;
}) {
  const [state, action, pending] = useActionState<AxActionState, FormData>(axAction, {});
  return (
    <form action={action} className={className}>
      <input type="hidden" name="claimId" value={claimId} />
      {type && <input type="hidden" name="type" value={type} />}
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
      {state.error && (
        <p role="alert" className="mt-2 basis-full rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs text-rose-700">
          {state.error}
        </p>
      )}
      {state.ok && !hideOk && !pending && (
        <p role="status" className="mt-2 basis-full text-xs font-medium text-emerald-700">
          {state.ok}
        </p>
      )}
    </form>
  );
}

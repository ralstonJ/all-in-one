"use client";

import { useFormStatus } from "react-dom";
import { LogIn, LogOut } from "lucide-react";

/** Submit button for the clock form; disabled while the request is in flight. */
export function ClockButton({ clockedIn }: { clockedIn: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-lg font-semibold text-white shadow-sm transition disabled:opacity-60 sm:w-auto ${
        clockedIn ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
      }`}
    >
      {clockedIn ? <LogOut className="h-5 w-5" aria-hidden /> : <LogIn className="h-5 w-5" aria-hidden />}
      {pending ? "Saving…" : clockedIn ? "Clock out" : "Clock in"}
    </button>
  );
}

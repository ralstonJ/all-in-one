"use client";

import { Trash2 } from "lucide-react";
import { deleteSopAction } from "@/app/actions/sops";

export function DeleteSopButton({ id, title }: { id: string; title: string }) {
  return (
    <form
      action={deleteSopAction}
      onSubmit={(e) => {
        if (!window.confirm(`Delete "${title}"? This can't be undone.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50"
      >
        <Trash2 className="h-4 w-4" aria-hidden /> Delete
      </button>
    </form>
  );
}

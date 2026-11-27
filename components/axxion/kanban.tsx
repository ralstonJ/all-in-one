import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Column, KanbanCard, KanbanWeek } from "@/lib/axxion/kanban";
import { card as cardCls, fmt } from "@/components/axxion/ui";

const COLUMNS: { key: Column; label: string; dot: string }[] = [
  { key: "todo", label: "To do", dot: "bg-slate-400" },
  { key: "doing", label: "In progress", dot: "bg-amber-500" },
  { key: "done", label: "Done", dot: "bg-emerald-500" },
];

const SHOWN = 6;

/** Weekly accordions, each a To do / In progress / Done board for claim handlers and Head of Claims. */
export function WeeklyKanban({ weeks }: { weeks: KanbanWeek[] }) {
  return (
    <section className={cardCls}>
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="font-semibold text-slate-900">Claims desk board</h2>
        <p className="text-xs text-slate-500">
          Tasks for all claim handlers and the Head of Claims, by week. To do is the next step a claim reaches; in progress is the step it is on now.
        </p>
      </div>
      <div className="divide-y divide-slate-100">
        {weeks.map((w) => (
          <details key={w.key} open={w.isCurrent} className="group">
            <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-3 hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-90" aria-hidden />
              <span className="font-medium text-slate-900">{w.label}</span>
              <span className="text-sm text-slate-500">{w.range}</span>
              <span className="ml-auto flex flex-wrap justify-end gap-1.5 text-[11px] font-medium">
                {COLUMNS.map((c) => (
                  <span key={c.key} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                    <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} aria-hidden />
                    {c.label} {w.columns[c.key].length}
                  </span>
                ))}
              </span>
            </summary>
            <div className="grid grid-cols-[repeat(3,minmax(15rem,1fr))] gap-3 overflow-x-auto bg-slate-50/60 px-5 py-4">
              {COLUMNS.map((c) => (
                <KanbanColumn key={c.key} label={c.label} dot={c.dot} cards={w.columns[c.key]} />
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

function KanbanColumn({ label, dot, cards }: { label: string; dot: string; cards: KanbanCard[] }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 self-start rounded-xl bg-slate-100/80 p-2">
      <h3 className="flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
        <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden />
        {label}
        <span className="ml-auto tabular-nums text-slate-500">{cards.length}</span>
      </h3>
      {cards.length === 0 && <p className="px-1 py-3 text-center text-xs text-slate-500">Nothing here</p>}
      {cards.slice(0, SHOWN).map((k) => (
        <TaskCard key={k.key} k={k} />
      ))}
      {cards.length > SHOWN && (
        <details className="group/more">
          <summary className="cursor-pointer list-none rounded-lg px-1 py-1 text-xs font-medium text-indigo-700 hover:underline [&::-webkit-details-marker]:hidden">
            <span className="group-open/more:hidden">Show {cards.length - SHOWN} more</span>
            <span className="hidden group-open/more:inline">Show fewer</span>
          </summary>
          <div className="mt-2 flex flex-col gap-2">
            {cards.slice(SHOWN).map((k) => (
              <TaskCard key={k.key} k={k} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function TaskCard({ k }: { k: KanbanCard }) {
  const c = k.claim;
  const when =
    k.column === "done" ? `Done ${fmt(k.at)}` : k.column === "todo" ? `After ${k.after}` : k.timing === "breached" ? `Breached · was due ${fmt(k.at)}` : `Due ${fmt(k.at)}`;
  const ref = k.canOpen ? (
    <Link href={`/axxion/claims/${c.id}`} className="font-semibold text-slate-900 hover:underline">{c.id}</Link>
  ) : (
    <span className="font-semibold text-slate-900">{c.id}</span>
  );
  return (
    <article className={`rounded-lg border bg-white p-2.5 text-xs shadow-sm ${k.isMe ? "border-indigo-300" : "border-slate-200"}`}>
      <p className="text-sm font-medium text-slate-900">{k.title}</p>
      <p className="mt-0.5 text-slate-500">
        {ref} · {c.vehicle.make} {c.vehicle.model}
      </p>
      <p className="mt-1.5 flex flex-wrap items-center gap-1">
        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${k.role === "Head of Claims" ? "bg-violet-50 text-violet-700" : "bg-sky-50 text-sky-700"}`}>
          {k.role}
        </span>
        <span className="text-slate-700">{k.person}</span>
        {k.isMe && <span className="rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">You</span>}
      </p>
      <p className={`mt-1 ${k.timing === "breached" ? "font-medium text-rose-700" : "text-slate-500"}`}>{when}</p>
    </article>
  );
}

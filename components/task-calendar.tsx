"use client";

import { useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import type { EventClickArg, EventInput } from "@fullcalendar/core";
import { Car, CheckCircle2, ClipboardList, MapPin, RotateCcw, User, X } from "lucide-react";
import type { Task, TaskKind } from "@/lib/data/tasks";
import { reopenTask } from "@/app/actions/tasks";
import { CompleteJobForm } from "@/components/complete-job-form";

/** Workshop jobs can be completed; meetings and training can't. */
const isJob = (t: Task) => t.kind !== "Meeting" && t.kind !== "Training";
const DONE = { bg: "#e7f6ec", border: "#16a34a", text: "#14532d" };

/** Light fill + dark ink per task type; the type is also written on the event. */
const KIND_STYLE: Record<TaskKind, { bg: string; border: string; text: string; chip: string }> = {
  Service: { bg: "#e0ecfd", border: "#3987e5", text: "#0d366b", chip: "bg-blue-50 text-blue-800" },
  Brakes: { bg: "#fde8e1", border: "#d0603b", text: "#6b230d", chip: "bg-orange-50 text-orange-800" },
  Inspection: { bg: "#dff3e6", border: "#2f9e5b", text: "#0f4a28", chip: "bg-emerald-50 text-emerald-800" },
  Diagnostics: { bg: "#efe6fb", border: "#8a5cd6", text: "#3b1d6e", chip: "bg-violet-50 text-violet-800" },
  Repair: { bg: "#fbf0d8", border: "#c9971c", text: "#5a4106", chip: "bg-amber-50 text-amber-800" },
  Training: { bg: "#dcf2f4", border: "#1f9aa6", text: "#0b4a50", chip: "bg-teal-50 text-teal-800" },
  Meeting: { bg: "#eceef1", border: "#64748b", text: "#1f2937", chip: "bg-slate-100 text-slate-700" },
};

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
const dayLabel = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

export function TaskCalendar({ tasks }: { tasks: Task[] }) {
  const calendarRef = useRef<FullCalendar>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const selected = selectedId ? byId.get(selectedId) ?? null : null;
  const setSelected = (t: Task | null) => setSelectedId(t?.id ?? null);
  const now = new Date();

  const events: EventInput[] = tasks.map((t) => {
    const style = t.completion ? DONE : KIND_STYLE[t.kind];
    const past = new Date(t.end) < now && (!isJob(t) || !!t.completion);
    return {
      id: t.id,
      title: t.title,
      start: t.start,
      end: t.end,
      backgroundColor: style.bg,
      borderColor: style.border,
      textColor: style.text,
      classNames: past ? ["opacity-50"] : [],
      extendedProps: {
        kind: t.kind,
        plate: t.plate,
        bay: t.bay,
        done: !!t.completion,
        overdue: isJob(t) && !t.completion && new Date(t.end) < now,
      },
    };
  });

  const upcoming = tasks
    .filter((t) => new Date(t.end) >= now && !t.completion)
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, 6);

  const onEventClick = (arg: EventClickArg) => {
    setSelected(byId.get(arg.event.id) ?? null);
  };

  const kinds = [...new Set(tasks.map((t) => t.kind))];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="task-calendar">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            buttonText={{ today: "Today", month: "Month", week: "Week", day: "Day" }}
            events={events}
            eventClick={onEventClick}
            firstDay={1}
            weekends={false}
            nowIndicator
            allDaySlot={false}
            slotMinTime="06:00:00"
            slotMaxTime="18:00:00"
            scrollTime="06:30:00"
            slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
            eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
            dayMaxEvents={3}
            height="auto"
            expandRows
            locale="en-GB"
            views={{
              dayGridMonth: {
                dayHeaderFormat: { weekday: "short" },
                titleFormat: { month: "long", year: "numeric" },
              },
              timeGridWeek: {
                dayHeaderFormat: { weekday: "short", day: "numeric", month: "short" },
                titleFormat: { day: "numeric", month: "short", year: "numeric" },
              },
              timeGridDay: {
                dayHeaderFormat: { weekday: "long", day: "numeric", month: "long" },
                titleFormat: { day: "numeric", month: "long", year: "numeric" },
              },
            }}
            eventDisplay="block"
            eventContent={(arg) =>
              arg.view.type === "dayGridMonth" ? (
                <div className="flex min-w-0 items-center gap-1 overflow-hidden px-1 text-[11px]">
                  {arg.event.extendedProps.done && <span aria-label="Complete">✓</span>}
                  <span className="shrink-0 tabular-nums opacity-80">{arg.timeText}</span>
                  <span className="truncate font-medium">{arg.event.title}</span>
                </div>
              ) : (
                <div className="h-full overflow-hidden px-1.5 py-1 text-xs leading-tight">
                  <div className="font-semibold">
                    {arg.event.extendedProps.done && <span aria-label="Complete">✓ </span>}
                    {arg.event.title}
                  </div>
                  <div className="mt-0.5 truncate opacity-80">
                    {arg.event.extendedProps.done
                      ? "Complete"
                      : arg.event.extendedProps.overdue
                        ? "To complete"
                        : arg.event.extendedProps.kind}
                    {arg.view.type === "timeGridDay" && arg.event.extendedProps.plate
                      ? ` · ${arg.event.extendedProps.plate}`
                      : ""}
                    {arg.view.type === "timeGridDay" && arg.event.extendedProps.bay
                      ? ` · ${arg.event.extendedProps.bay}`
                      : ""}
                  </div>
                </div>
              )
            }
            windowResize={(arg) => {
              const api = calendarRef.current?.getApi();
              if (api && window.innerWidth < 640 && arg.view.type === "timeGridWeek") {
                api.changeView("timeGridDay");
              }
            }}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs" aria-label="Task types">
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            <span
              aria-hidden
              className="h-3 w-3 rounded-sm border-l-4"
              style={{ backgroundColor: DONE.bg, borderColor: DONE.border }}
            />
            ✓ Complete
          </span>
          {kinds.map((k) => (
            <span key={k} className="inline-flex items-center gap-1.5 text-slate-600">
              <span
                aria-hidden
                className="h-3 w-3 rounded-sm border-l-4"
                style={{ backgroundColor: KIND_STYLE[k].bg, borderColor: KIND_STYLE[k].border }}
              />
              {k}
            </span>
          ))}
        </div>
      </section>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        {selected ? (
          <TaskDetails task={selected} onClose={() => setSelected(null)} />
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-center text-sm text-slate-500">
            Click a task to see the vehicle, customer and job card, and to mark the job complete.
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Up next</h2>
          {upcoming.length ? (
            <ul className="mt-3 space-y-2">
              {upcoming.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(t);
                      calendarRef.current?.getApi().gotoDate(t.start);
                    }}
                    className="flex w-full items-start gap-3 rounded-lg border border-slate-200 px-3 py-2 text-left hover:border-slate-300 hover:bg-slate-50"
                  >
                    <span
                      aria-hidden
                      className="mt-1 h-8 w-1 shrink-0 rounded-full"
                      style={{ backgroundColor: KIND_STYLE[t.kind].border }}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-900">{t.title}</span>
                      <span className="block text-xs text-slate-500">
                        {dayLabel(t.start)} · {time(t.start)}–{time(t.end)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500">Nothing scheduled.</p>
          )}
        </section>
      </aside>
    </div>
  );
}

function TaskDetails({ task, onClose }: { task: Task; onClose: () => void }) {
  const style = KIND_STYLE[task.kind];
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${style.chip}`}>{task.kind}</span>
          <h2 className="mt-2 text-lg font-semibold leading-tight text-slate-900">{task.title}</h2>
          <p className="text-sm text-slate-600">
            {new Date(task.start).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
            {" · "}
            {time(task.start)}–{time(task.end)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close task details"
          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <dl className="mt-4 space-y-2 text-sm">
        {task.vehicle && (
          <Row icon={<Car className="h-4 w-4" aria-hidden />} label="Vehicle">
            {task.vehicle}
            {task.plate && <span className="block text-xs text-slate-500">{task.plate}</span>}
          </Row>
        )}
        {task.customer && (
          <Row icon={<User className="h-4 w-4" aria-hidden />} label="Customer">{task.customer}</Row>
        )}
        {task.jobCard && (
          <Row icon={<ClipboardList className="h-4 w-4" aria-hidden />} label="Job card">{task.jobCard}</Row>
        )}
        {task.bay && <Row icon={<MapPin className="h-4 w-4" aria-hidden />} label="Where">{task.bay}</Row>}
      </dl>
      {task.notes && <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{task.notes}</p>}

      {task.completion ? (
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            Completed{" "}
            {new Date(task.completion.completedAt).toLocaleString("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p className="whitespace-pre-line rounded-lg bg-emerald-50 px-3 py-2 text-sm text-slate-800">
            {task.completion.comment}
          </p>
          {task.completion.photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {task.completion.photos.map((p, i) => (
                <a
                  key={p.id}
                  href={`/api/photos/${p.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block aspect-square overflow-hidden rounded-lg border border-slate-200 hover:opacity-90"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/photos/${p.id}`}
                    alt={`Job photo ${i + 1} for ${task.title}`}
                    className="h-full w-full object-cover"
                  />
                </a>
              ))}
            </div>
          )}
          <form action={reopenTask}>
            <input type="hidden" name="taskId" value={task.id} />
            <button
              type="submit"
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Reopen job (removes the photos)
            </button>
          </form>
        </div>
      ) : isJob(task) && new Date(task.start) <= new Date() ? (
        <CompleteJobForm key={task.id} taskId={task.id} />
      ) : isJob(task) ? (
        <p className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
          You can mark this job complete once it has started.
        </p>
      ) : null}
    </section>
  );
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="mt-0.5 text-slate-400">
        {icon}
        <span className="sr-only">{label}</span>
      </dt>
      <dd className="text-slate-800">{children}</dd>
    </div>
  );
}

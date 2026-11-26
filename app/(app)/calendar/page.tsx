import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getTasksFor } from "@/lib/tasks";
import { TaskCalendar } from "@/components/task-calendar";

export const metadata: Metadata = { title: "Calendar" };

export default async function CalendarPage() {
  const user = await requireUser();
  const tasks = user.person ? getTasksFor(user.person.id) : [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Calendar</h1>
        <p className="text-sm text-slate-500">
          {user.person
            ? `Upcoming tasks for ${user.person.name}. Switch between month, week and day.`
            : "This account isn't linked to anyone on the org chart, so it has no tasks."}
        </p>
      </div>
      <TaskCalendar tasks={tasks} />
    </div>
  );
}

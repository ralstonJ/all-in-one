import "server-only";
import { generateTasks, type Task } from "@/lib/data/tasks";
import { getCompletions } from "@/lib/time-store";

export type { Task, TaskKind, TaskCompletion, TaskPhoto } from "@/lib/data/tasks";

export function getTasksFor(personId: string): Task[] {
  const done = new Map(getCompletions(personId).map((c) => [c.taskId, c]));
  return generateTasks()
    .filter((t) => t.personId === personId)
    .map((t) => {
      const c = done.get(t.id);
      return c
        ? { ...t, completion: { completedAt: c.completedAt, comment: c.comment, photos: c.photos } }
        : t;
    });
}

export function findTask(personId: string, taskId: string): Task | undefined {
  return getTasksFor(personId).find((t) => t.id === taskId);
}

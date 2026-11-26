/**
 * Mock task schedule. Generated relative to today so the calendar always has
 * upcoming work: the rest of this week plus the next four weeks, and earlier
 * days this week (shown as done).
 */

export type TaskKind =
  | "Service"
  | "Brakes"
  | "Inspection"
  | "Diagnostics"
  | "Repair"
  | "Training"
  | "Meeting";

export type Task = {
  id: string;
  personId: string;
  title: string;
  kind: TaskKind;
  start: string; // ISO
  end: string; // ISO
  vehicle?: string;
  plate?: string;
  customer?: string;
  jobCard?: string;
  bay?: string;
  notes?: string;
  /** Filled in when the job has been marked complete. */
  completion?: TaskCompletion;
};

export type TaskPhoto = { id: string; contentType: string };

export type TaskCompletion = {
  completedAt: string; // ISO
  comment: string;
  photos: TaskPhoto[];
};

type Template = Omit<Task, "id" | "personId" | "start" | "end"> & { hours: number };

/** Emily's job mix: servicing, brakes and roadworthy inspections. */
const EMILY_JOBS: Template[] = [
  { title: "60,000 km service", kind: "Service", hours: 2.5, vehicle: "Toyota Camry 2021", plate: "Dubai P 48213", customer: "S. Al Mansoori", bay: "Bay 3" },
  { title: "Front brake pads & rotors", kind: "Brakes", hours: 2, vehicle: "Nissan Patrol 2019", plate: "Dubai K 10294", customer: "R. Thomas", bay: "Bay 3" },
  { title: "Roadworthy inspection", kind: "Inspection", hours: 1, vehicle: "Honda Civic 2017", plate: "Sharjah 3 77120", customer: "M. Haddad", bay: "Bay 3" },
  { title: "Check engine light diagnosis", kind: "Diagnostics", hours: 1.5, vehicle: "Kia Sportage 2020", plate: "Dubai J 55831", customer: "Fleet: Gulf Couriers", bay: "Bay 1", notes: "Pair with Jake if it's a timing issue." },
  { title: "Minor service + A/C check", kind: "Service", hours: 1.5, vehicle: "Hyundai Tucson 2022", plate: "Dubai L 20457", customer: "A. Khan", bay: "Bay 3" },
  { title: "Rear brake shoes & drums", kind: "Brakes", hours: 2, vehicle: "Toyota Hilux 2018", plate: "Dubai F 66012", customer: "Fleet: Desert Build LLC", bay: "Bay 3" },
  { title: "Pre-purchase inspection", kind: "Inspection", hours: 1.5, vehicle: "Mazda CX-5 2019", plate: "Dubai T 31890", customer: "L. Fernandes", bay: "Bay 3" },
  { title: "Suspension noise investigation", kind: "Repair", hours: 2, vehicle: "Mitsubishi Pajero 2016", plate: "Abu Dhabi 5 90321", customer: "K. Nair", bay: "Bay 2", notes: "Ravi to assist on alignment afterwards." },
  { title: "Brake fluid flush & service", kind: "Service", hours: 1.5, vehicle: "Ford Ranger 2021", plate: "Dubai H 77302", customer: "Fleet: Gulf Couriers", bay: "Bay 3" },
];

const pad = (n: number) => String(n).padStart(2, "0");

function at(day: Date, hours: number): Date {
  const d = new Date(day);
  d.setHours(Math.floor(hours), Math.round((hours % 1) * 60), 0, 0);
  return d;
}

function iso(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

function mondayOf(d: Date) {
  const m = new Date(d);
  m.setHours(0, 0, 0, 0);
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return m;
}

/** Stable id: the same task keeps its id across days and restarts. */
const taskId = (personId: string, start: string, title: string) =>
  `${personId}_${start.replace(/[^0-9]/g, "")}_${title.length}`;

export function generateTasks(now = new Date()): Task[] {
  const tasks: Task[] = [];
  const start = mondayOf(now);

  for (let i = 0; i < 7 * 5; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    const dow = day.getDay();
    if (dow === 0 || dow === 6) continue; // weekdays only

    // Emily: a morning block and an afternoon block, rotating through the job mix.
    let clock = 7.25;
    const jobsToday = i % 3 === 2 ? 2 : 3;
    for (let j = 0; j < jobsToday; j++) {
      const tpl = EMILY_JOBS[(i * 3 + j) % EMILY_JOBS.length];
      if (clock < 12 && clock + tpl.hours > 12) clock = 12.5; // lunch
      const s = at(day, clock);
      const e = at(day, clock + tpl.hours);
      const { hours: _h, ...rest } = tpl;
      void _h;
      tasks.push({
        ...rest,
        id: taskId("emily-chen", iso(s), tpl.title),
        personId: "emily-chen",
        jobCard: `JC-${4400 + i * 3 + j}`,
        start: iso(s),
        end: iso(e),
      });
      clock += tpl.hours + 0.25;
    }

    // Weekly toolbox talk (Mon) and fortnightly training (Wed).
    if (dow === 1) {
      for (const personId of ["emily-chen", "aisha-rahman"]) {
        tasks.push({
          id: taskId(personId, iso(at(day, 6.75)), "toolbox"),
          personId,
          title: "Toolbox talk: safety & week plan",
          kind: "Meeting",
          start: iso(at(day, 6.75)),
          end: iso(at(day, 7.0)),
          bay: "Workshop floor",
          notes: "Run by Aisha Rahman.",
        });
      }
    }
    if (dow === 3 && Math.floor(i / 7) % 2 === 1) {
      tasks.push({
        id: taskId("emily-chen", iso(at(day, 14.5)), "training"),
        personId: "emily-chen",
        title: "Hybrid systems awareness training",
        kind: "Training",
        start: iso(at(day, 14.5)),
        end: iso(at(day, 16)),
        bay: "Training room",
        notes: "Delivered by Omar Haddad from the HV bay.",
      });
    }
    // Aisha: daily job allocation and Thursday review with Marcus.
    tasks.push({
      id: taskId("aisha-rahman", iso(at(day, 7.0)), "allocation"),
      personId: "aisha-rahman",
      title: "Job allocation & parts check",
      kind: "Meeting",
      start: iso(at(day, 7.0)),
      end: iso(at(day, 7.5)),
      bay: "Workshop office",
    });
    if (dow === 4) {
      tasks.push({
        id: taskId("aisha-rahman", iso(at(day, 15)), "review"),
        personId: "aisha-rahman",
        title: "Weekly workshop review with Marcus Bell",
        kind: "Meeting",
        start: iso(at(day, 15)),
        end: iso(at(day, 16)),
        bay: "Workshop office",
      });
    }
  }
  return tasks;
}

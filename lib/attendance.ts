import { ATTENDANCE_PERIOD, absences } from "@/lib/data/attendance";
import { getAllPeople, type Person } from "@/lib/org";

export { ATTENDANCE_PERIOD, ATTENDANCE_TARGET } from "@/lib/data/attendance";

export type PersonAttendance = {
  person: Person;
  scheduled: number;
  present: number;
  sick: number;
  unplanned: number;
  late: number;
  rate: number;
};

export type DepartmentAttendance = {
  department: string;
  headcount: number;
  scheduled: number;
  present: number;
  sick: number;
  unplanned: number;
  rate: number;
  people: PersonAttendance[];
};

const pct = (present: number, scheduled: number) =>
  scheduled ? (present / scheduled) * 100 : 100;

export function getPersonAttendance(): PersonAttendance[] {
  return getAllPeople().map((person) => {
    const a = absences[person.id] ?? { sick: 0, unplanned: 0 };
    const scheduled = ATTENDANCE_PERIOD.workingDays;
    const present = scheduled - a.sick - a.unplanned;
    return {
      person,
      scheduled,
      present,
      sick: a.sick,
      unplanned: a.unplanned,
      late: a.late ?? 0,
      rate: pct(present, scheduled),
    };
  });
}

/** Departments sorted lowest attendance first. */
export function getDepartmentAttendance(): DepartmentAttendance[] {
  const groups = new Map<string, PersonAttendance[]>();
  for (const row of getPersonAttendance()) {
    const list = groups.get(row.person.department) ?? [];
    list.push(row);
    groups.set(row.person.department, list);
  }
  return [...groups.entries()]
    .map(([department, people]) => {
      const scheduled = people.reduce((s, p) => s + p.scheduled, 0);
      const present = people.reduce((s, p) => s + p.present, 0);
      return {
        department,
        headcount: people.length,
        scheduled,
        present,
        sick: people.reduce((s, p) => s + p.sick, 0),
        unplanned: people.reduce((s, p) => s + p.unplanned, 0),
        rate: pct(present, scheduled),
        people: [...people].sort((a, b) => a.rate - b.rate || a.person.name.localeCompare(b.person.name)),
      };
    })
    .sort((a, b) => a.rate - b.rate || a.department.localeCompare(b.department));
}

export function getOverallAttendance() {
  const rows = getPersonAttendance();
  const scheduled = rows.reduce((s, p) => s + p.scheduled, 0);
  const present = rows.reduce((s, p) => s + p.present, 0);
  return {
    scheduled,
    present,
    absences: scheduled - present,
    rate: pct(present, scheduled),
  };
}

export function formatRate(rate: number) {
  return `${rate.toFixed(rate % 1 === 0 ? 0 : 1)}%`;
}

import { people, type Person } from "@/lib/data/people";

export type { Person } from "@/lib/data/people";

const byId = new Map(people.map((p) => [p.id, p]));

const reportsIndex = new Map<string | null, Person[]>();
for (const p of people) {
  const list = reportsIndex.get(p.reportsTo) ?? [];
  list.push(p);
  reportsIndex.set(p.reportsTo, list);
}
for (const list of reportsIndex.values()) {
  list.sort((a, b) => a.name.localeCompare(b.name));
}

export function getAllPeople(): Person[] {
  return people;
}

export function getPerson(id: string): Person | undefined {
  return byId.get(id);
}

export function getManager(person: Person): Person | undefined {
  return person.reportsTo ? byId.get(person.reportsTo) : undefined;
}

export function getDirectReports(personId: string | null): Person[] {
  return reportsIndex.get(personId) ?? [];
}

/** Everyone below this person in the chart, at any depth. */
export function getAllReports(personId: string): Person[] {
  const out: Person[] = [];
  const stack = [...getDirectReports(personId)];
  while (stack.length) {
    const p = stack.pop()!;
    out.push(p);
    stack.push(...getDirectReports(p.id));
  }
  return out;
}

/** Chain of managers from the top of the chart down to (not including) the person. */
export function getManagementChain(person: Person): Person[] {
  const chain: Person[] = [];
  let current = getManager(person);
  while (current) {
    chain.unshift(current);
    current = getManager(current);
  }
  return chain;
}

export function getRoots(): Person[] {
  return getDirectReports(null);
}

export function getDepartments(): string[] {
  return [...new Set(people.map((p) => p.department))];
}

export function getTeams(): string[] {
  return [...new Set(people.flatMap((p) => (p.team ? [p.team] : [])))];
}

export function getPeopleInDepartment(department: string): Person[] {
  return people.filter((p) => p.department === department);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

/**
 * Colour accents per department. Full class strings so Tailwind can see them.
 */
const DEPARTMENT_STYLES: Record<
  string,
  { avatar: string; badge: string; ring: string; dot: string }
> = {
  Executive: {
    avatar: "bg-slate-800 text-white",
    badge: "bg-slate-100 text-slate-800",
    ring: "ring-slate-400",
    dot: "bg-slate-700",
  },
  Management: {
    avatar: "bg-indigo-600 text-white",
    badge: "bg-indigo-50 text-indigo-700",
    ring: "ring-indigo-400",
    dot: "bg-indigo-500",
  },
  Operations: {
    avatar: "bg-amber-600 text-white",
    badge: "bg-amber-50 text-amber-800",
    ring: "ring-amber-400",
    dot: "bg-amber-500",
  },
  Estimating: {
    avatar: "bg-teal-600 text-white",
    badge: "bg-teal-50 text-teal-800",
    ring: "ring-teal-400",
    dot: "bg-teal-500",
  },
  Finance: {
    avatar: "bg-emerald-600 text-white",
    badge: "bg-emerald-50 text-emerald-800",
    ring: "ring-emerald-400",
    dot: "bg-emerald-500",
  },
  "Body Shop": {
    avatar: "bg-rose-600 text-white",
    badge: "bg-rose-50 text-rose-800",
    ring: "ring-rose-400",
    dot: "bg-rose-500",
  },
  Mechanical: {
    avatar: "bg-sky-600 text-white",
    badge: "bg-sky-50 text-sky-800",
    ring: "ring-sky-400",
    dot: "bg-sky-500",
  },
  "EV & High Voltage": {
    avatar: "bg-lime-600 text-white",
    badge: "bg-lime-50 text-lime-800",
    ring: "ring-lime-400",
    dot: "bg-lime-500",
  },
  "Front of House": {
    avatar: "bg-fuchsia-600 text-white",
    badge: "bg-fuchsia-50 text-fuchsia-800",
    ring: "ring-fuchsia-400",
    dot: "bg-fuchsia-500",
  },
};

const FALLBACK_STYLE = {
  avatar: "bg-gray-500 text-white",
  badge: "bg-gray-100 text-gray-700",
  ring: "ring-gray-400",
  dot: "bg-gray-400",
};

export function departmentStyle(department: string) {
  return DEPARTMENT_STYLES[department] ?? FALLBACK_STYLE;
}

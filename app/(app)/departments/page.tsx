import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { departmentStyle, getDepartments, getPeopleInDepartment } from "@/lib/org";
import { PersonRow } from "@/components/person-profile";

export const metadata: Metadata = { title: "Departments" };

export default async function DepartmentsPage() {
  await requireUser();
  const departments = getDepartments();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Departments</h1>
        <p className="text-sm text-slate-500">People grouped by department, then team.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {departments.map((department) => {
          const members = getPeopleInDepartment(department);
          const style = departmentStyle(department);
          const teams = new Map<string, typeof members>();
          for (const m of members) {
            const key = m.team ?? "";
            teams.set(key, [...(teams.get(key) ?? []), m]);
          }
          const teamNames = [...teams.keys()].sort((a, b) =>
            a === "" ? 1 : b === "" ? -1 : a.localeCompare(b),
          );
          return (
            <section
              key={department}
              id={department}
              aria-labelledby={`dept-${department}`}
              className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <h2
                  id={`dept-${department}`}
                  className="flex items-center gap-2 text-lg font-semibold text-slate-900"
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} aria-hidden />
                  {department}
                </h2>
                <span className="text-sm text-slate-500">
                  {members.length} {members.length === 1 ? "person" : "people"}
                </span>
              </div>
              <div className="mt-4 space-y-4">
                {teamNames.map((team) => (
                  <div key={team || "no-team"}>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {team || "No team"}
                    </h3>
                    <ul className="mt-2 space-y-1.5">
                      {teams.get(team)!.map((m) => (
                        <li key={m.id}>
                          <PersonRow person={m} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

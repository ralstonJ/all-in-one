import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import {
  departmentStyle,
  getAllReports,
  getDirectReports,
  getManagementChain,
  type Person,
} from "@/lib/org";
import { Avatar } from "@/components/avatar";
import { PersonPanel } from "@/components/person-panel";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function PersonProfile({ person }: { person: Person }) {
  const style = departmentStyle(person.department);
  const reports = getDirectReports(person.id);
  const everyone = getAllReports(person.id);
  const line = [...getManagementChain(person), person];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
        <div className="flex flex-wrap items-start gap-5">
          <Avatar name={person.name} size="xl" className={style.avatar} />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {person.name}
            </h1>
            <p className="text-slate-600">{person.title}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style.badge}`}>
                {person.department}
              </span>
              {person.team ? (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                  Team: {person.team}
                </span>
              ) : (
                <span className="text-xs text-slate-400">No team</span>
              )}
            </div>
            {person.focus && <p className="mt-3 text-sm text-slate-700">{person.focus}</p>}
          </div>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Location" icon={<MapPin className="h-4 w-4" aria-hidden />}>
            {person.location}
          </Field>
          <Field label="Extension" icon={<Phone className="h-4 w-4" aria-hidden />}>
            ext. {person.extension}
          </Field>
          <Field label="Email" icon={<Mail className="h-4 w-4" aria-hidden />}>
            <a href={`mailto:${person.email}`} className="hover:underline">
              {person.email}
            </a>
          </Field>
          <Field label="Started">{formatDate(person.startDate)}</Field>
        </dl>
      </section>

      <aside className="lg:sticky lg:top-24">
        <PersonPanel
          person={person}
          line={line}
          reports={reports}
          action={{ href: `/org-chart?focus=${person.id}`, label: "View in org chart" }}
        />
        {everyone.length > reports.length && (
          <p className="mt-2 text-xs text-slate-500">
            {everyone.length} people in total below {person.name.split(" ")[0]}.
          </p>
        )}
      </aside>
    </div>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
        {icon} {label}
      </dt>
      <dd className="mt-1 text-sm text-slate-800">{children}</dd>
    </div>
  );
}

export function PersonRow({ person }: { person: Person }) {
  const style = departmentStyle(person.department);
  return (
    <Link
      href={`/people/${person.id}`}
      className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 hover:border-slate-300 hover:bg-slate-50"
    >
      <Avatar name={person.name} size="sm" className={style.avatar} />
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-slate-900">
          {person.name}
        </span>
        <span className="block truncate text-xs text-slate-500">
          {person.title}
          {person.team ? ` · ${person.team}` : ""}
        </span>
      </span>
    </Link>
  );
}

"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Mail, MapPin, Phone, X } from "lucide-react";
import type { Person } from "@/lib/data/people";
import { departmentStyle } from "@/lib/org";
import { Avatar } from "@/components/avatar";

export type PersonPanelProps = {
  person: Person;
  /** Reporting line from the top of the chart down to `person` (inclusive). */
  line: Person[];
  reports: Person[];
  /**
   * When given, people in the panel are buttons that call this (org chart).
   * Otherwise they link to that person's profile page.
   */
  onSelect?: (id: string) => void;
  onClose?: () => void;
  /** Button at the bottom of the panel. */
  action: { href: string; label: string };
};

/**
 * The person side panel: header, details, reporting line up to the top of the
 * chart, direct reports. Shared by the org chart and the profile pages.
 */
export function PersonPanel({
  person,
  line,
  reports,
  onSelect,
  onClose,
  action,
}: PersonPanelProps) {
  const style = departmentStyle(person.department);
  const manager = line.length > 1 ? line[line.length - 2] : undefined;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Avatar name={person.name} size="lg" className={style.avatar} />
          <div className="min-w-0">
            <h2 className="text-lg font-semibold leading-tight text-slate-900">
              {person.name}
            </h2>
            <p className="text-sm text-slate-600">{person.title}</p>
            <span
              className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${style.badge}`}
            >
              {person.department}
            </span>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-slate-500">Team</dt>
        <dd className="text-slate-800">
          {person.team ?? <span className="text-slate-400">No team</span>}
        </dd>
        <dt className="text-slate-500">Reports to</dt>
        <dd className="text-slate-800">
          {manager ? (
            <PersonName person={manager} onSelect={onSelect} />
          ) : (
            <span className="text-slate-400">No one (top of the chart)</span>
          )}
        </dd>
        {person.focus && (
          <>
            <dt className="text-slate-500">Focus</dt>
            <dd className="text-slate-800">{person.focus}</dd>
          </>
        )}
        <dt className="text-slate-500">
          <MapPin className="inline h-3.5 w-3.5" aria-hidden />{" "}
          <span className="sr-only">Location</span>
        </dt>
        <dd className="text-slate-800">{person.location}</dd>
        <dt className="text-slate-500">
          <Phone className="inline h-3.5 w-3.5" aria-hidden />{" "}
          <span className="sr-only">Extension</span>
        </dt>
        <dd className="text-slate-800">ext. {person.extension}</dd>
        <dt className="text-slate-500">
          <Mail className="inline h-3.5 w-3.5" aria-hidden />{" "}
          <span className="sr-only">Email</span>
        </dt>
        <dd className="truncate text-slate-800">
          <a href={`mailto:${person.email}`} className="hover:underline">
            {person.email}
          </a>
        </dd>
      </dl>

      <Section title="Reporting line to the top">
        <ol className="relative ml-3 border-l-2 border-slate-200 pl-5">
          {line.map((p, index) => {
            const isCurrent = p.id === person.id;
            return (
              <li key={p.id} className="relative pb-3 last:pb-0">
                <span
                  aria-hidden
                  className={`absolute -left-[1.6rem] top-3 h-3 w-3 rounded-full ring-4 ring-white ${
                    isCurrent ? "bg-blue-500" : departmentStyle(p.department).dot
                  }`}
                />
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {lineLabel(index, line.length)}
                </p>
                {isCurrent ? (
                  <div className="flex items-center gap-3 rounded-lg border border-blue-300 bg-blue-50 px-3 py-2">
                    <Avatar
                      name={p.name}
                      size="sm"
                      className={departmentStyle(p.department).avatar}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-900">
                        {p.name}
                      </span>
                      <span className="block truncate text-xs text-slate-600">
                        {p.title}
                        {p.team ? ` · ${p.team}` : ""}
                      </span>
                    </span>
                  </div>
                ) : (
                  <PersonItem person={p} onSelect={onSelect} />
                )}
              </li>
            );
          })}
        </ol>
        {line.length > 1 && (
          <p className="mt-2 text-xs text-slate-500">
            {line.length - 1} {line.length - 1 === 1 ? "level" : "levels"} below{" "}
            {line[0].name}.
          </p>
        )}
      </Section>

      <Section title={`Direct reports (${reports.length})`}>
        {reports.length ? (
          <ul className="space-y-1">
            {reports.map((r) => (
              <li key={r.id}>
                <PersonItem person={r} onSelect={onSelect} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No direct reports.</p>
        )}
      </Section>

      <Link
        href={action.href}
        className="mt-5 block rounded-lg bg-slate-900 px-3 py-2 text-center text-sm font-medium text-white hover:bg-slate-800"
      >
        {action.label}
      </Link>
    </div>
  );
}

/** Caption for each step of the reporting line (index 0 is the top of the chart). */
function lineLabel(index: number, length: number): string {
  const isTop = index === 0;
  const isSelected = index === length - 1;
  if (isTop && isSelected) return "Top of the chart (selected)";
  if (isTop) return "Top of the chart";
  if (isSelected) return "Selected";
  if (index === length - 2) return "Reports to";
  return `Level ${index + 1}`;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-5">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function PersonName({
  person,
  onSelect,
}: {
  person: Person;
  onSelect?: (id: string) => void;
}) {
  return onSelect ? (
    <button
      type="button"
      onClick={() => onSelect(person.id)}
      className="font-medium hover:underline"
    >
      {person.name}
    </button>
  ) : (
    <Link href={`/people/${person.id}`} className="font-medium hover:underline">
      {person.name}
    </Link>
  );
}

function PersonItem({
  person,
  onSelect,
}: {
  person: Person;
  onSelect?: (id: string) => void;
}) {
  const style = departmentStyle(person.department);
  const className =
    "flex w-full items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-left hover:border-slate-300 hover:bg-slate-50";
  const content = (
    <>
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
    </>
  );
  return onSelect ? (
    <button type="button" onClick={() => onSelect(person.id)} className={className}>
      {content}
    </button>
  ) : (
    <Link href={`/people/${person.id}`} className={className}>
      {content}
    </Link>
  );
}

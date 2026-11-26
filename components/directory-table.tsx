"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import type { Person } from "@/lib/data/people";
import { departmentStyle } from "@/lib/org";
import { Avatar } from "@/components/avatar";

export type DirectoryRow = Person & {
  managerName: string | null;
  reportCount: number;
};

export function DirectoryTable({
  rows,
  departments,
}: {
  rows: DirectoryRow[];
  departments: string[];
}) {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (department && r.department !== department) return false;
      if (!q) return true;
      return [r.name, r.title, r.department, r.team ?? "", r.focus ?? "", r.managerName ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [rows, query, department]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="relative min-w-[14rem] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, title, team or manager"
            aria-label="Search the directory"
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-9 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <span className="sr-only sm:not-sr-only">Department</span>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="rounded-lg border border-slate-300 py-2 pl-3 pr-8 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <span className="text-xs text-slate-500" aria-live="polite">
          {filtered.length} of {rows.length}
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3">Name</th>
                <th scope="col" className="px-4 py-3">Title</th>
                <th scope="col" className="px-4 py-3">Department</th>
                <th scope="col" className="px-4 py-3">Team</th>
                <th scope="col" className="px-4 py-3">Reports to</th>
                <th scope="col" className="px-4 py-3 text-right">Reports</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => {
                const style = departmentStyle(r.department);
                return (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5">
                      <Link href={`/people/${r.id}`} className="flex items-center gap-3">
                        <Avatar name={r.name} size="sm" className={style.avatar} />
                        <span className="font-medium text-slate-900 hover:underline">
                          {r.name}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-slate-700">{r.title}</td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${style.badge}`}>
                        {r.department}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-700">
                      {r.team ?? <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-slate-700">
                      {r.reportsTo ? (
                        <Link href={`/people/${r.reportsTo}`} className="hover:underline">
                          {r.managerName}
                        </Link>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                      {r.reportCount || <span className="text-slate-400">—</span>}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    No one matches that search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

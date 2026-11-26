"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FileText, Search, Users, X } from "lucide-react";

export type SopRow = {
  id: string;
  title: string;
  summary: string;
  departments: string[];
  authorName: string;
  updatedAt: string;
  version: number;
};

export function SopList({ sops, departments }: { sops: SopRow[]; departments: string[] }) {
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sops.filter(
      (s) =>
        (!dept || s.departments.includes(dept)) &&
        (!q || `${s.title} ${s.summary} ${s.departments.join(" ")}`.toLowerCase().includes(q)),
    );
  }, [sops, query, dept]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="relative min-w-[14rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search SOPs"
            aria-label="Search SOPs"
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
        <div role="group" aria-label="Filter by department" className="flex flex-wrap gap-1">
          {["", ...departments].map((d) => (
            <button
              key={d || "all"}
              type="button"
              onClick={() => setDept(d)}
              aria-pressed={dept === d}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                dept === d ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {d || "All"}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No SOPs match.
        </p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {filtered.map((s) => (
            <li key={s.id}>
              <Link
                href={`/docs/${s.id}`}
                className="flex h-full gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <FileText className="h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block font-medium text-slate-900">{s.title}</span>
                  {s.summary && <span className="mt-0.5 block text-sm text-slate-600">{s.summary}</span>}
                  <span className="mt-2 flex flex-wrap items-center gap-1.5">
                    {s.departments.length > 1 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                        <Users className="h-3 w-3" aria-hidden /> Shared
                      </span>
                    )}
                    {s.departments.map((d) => (
                      <span key={d} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                        {d}
                      </span>
                    ))}
                  </span>
                  <span className="mt-2 block text-xs text-slate-500">
                    v{s.version} · updated{" "}
                    {new Date(s.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    {" · "}by {s.authorName}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

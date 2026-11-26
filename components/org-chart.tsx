"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Search, X } from "lucide-react";
import type { Person } from "@/lib/data/people";
import { departmentStyle } from "@/lib/org";
import { Avatar } from "@/components/avatar";
import { PersonPanel } from "@/components/person-panel";

type Props = {
  people: Person[];
  /** Person to select and scroll to when the chart first renders. */
  initialFocusId?: string;
};

type Ctx = {
  childrenOf: Map<string | null, Person[]>;
  collapsed: Set<string>;
  selectedId: string | null;
  matches: Set<string> | null;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  registerRow: (id: string, el: HTMLElement | null) => void;
};

function searchText(p: Person) {
  return [p.name, p.title, p.department, p.team ?? "", p.focus ?? ""]
    .join(" ")
    .toLowerCase();
}

export function OrgChart({ people, initialFocusId }: Props) {
  const byId = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);

  const childrenOf = useMemo(() => {
    const map = new Map<string | null, Person[]>();
    for (const person of people) {
      const list = map.get(person.reportsTo) ?? [];
      list.push(person);
      map.set(person.reportsTo, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return map;
  }, [people]);

  const roots = childrenOf.get(null) ?? [];

  const ancestorsOf = (id: string): string[] => {
    const out: string[] = [];
    let current = byId.get(id)?.reportsTo ?? null;
    while (current) {
      out.push(current);
      current = byId.get(current)?.reportsTo ?? null;
    }
    return out;
  };

  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [selectedId, setSelectedId] = useState<string | null>(
    initialFocusId && byId.has(initialFocusId) ? initialFocusId : null,
  );
  const [query, setQuery] = useState("");
  const rowRefs = useRef(new Map<string, HTMLElement>());

  const normalizedQuery = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!normalizedQuery) return null;
    const set = new Set<string>();
    for (const p of people) {
      if (searchText(p).includes(normalizedQuery)) set.add(p.id);
    }
    return set;
  }, [people, normalizedQuery]);

  const expandAncestors = (ids: Iterable<string>) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      for (const id of ids) for (const a of ancestorsOf(id)) next.delete(a);
      return next.size === prev.size ? prev : next;
    });
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    const q = value.trim().toLowerCase();
    if (!q) return;
    expandAncestors(people.filter((p) => searchText(p).includes(q)).map((p) => p.id));
  };

  const selectPerson = (id: string) => {
    setSelectedId(id);
    expandAncestors([id]);
  };

  const toggleCollapsed = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Collapse everything below the first level so the top of the chart stays visible.
  const collapseAll = () =>
    setCollapsed(
      new Set(
        people
          .filter(
            (p) => p.reportsTo !== null && (childrenOf.get(p.id)?.length ?? 0) > 0,
          )
          .map((p) => p.id),
      ),
    );

  const registerRow = (id: string, el: HTMLElement | null) => {
    if (el) rowRefs.current.set(id, el);
    else rowRefs.current.delete(id);
  };

  // Keep the selected row in view (covers the initial ?focus= too). The short
  // delay lets the router's own scroll-to-top on navigation finish first.
  useEffect(() => {
    if (!selectedId) return;
    const timer = setTimeout(() => {
      rowRefs.current
        .get(selectedId)
        ?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 120);
    return () => clearTimeout(timer);
  }, [selectedId]);

  const ctx: Ctx = {
    childrenOf,
    collapsed,
    selectedId,
    matches,
    onSelect: selectPerson,
    onToggle: toggleCollapsed,
    registerRow,
  };

  const selected = selectedId ? byId.get(selectedId) ?? null : null;
  // Reporting line from the top of the chart down to the selected person.
  const selectedLine: Person[] = [];
  for (let cursor = selected; cursor; ) {
    selectedLine.unshift(cursor);
    cursor = cursor.reportsTo ? byId.get(cursor.reportsTo) ?? null : null;
  }
  const departments = new Set(people.map((p) => p.department)).size;
  const teams = new Set(people.flatMap((p) => (p.team ? [p.team] : []))).size;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="relative min-w-[14rem] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search name, title, department or team"
            aria-label="Search the org chart"
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-9 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>
        {matches && (
          <span className="text-xs text-slate-500" aria-live="polite">
            {matches.size} {matches.size === 1 ? "match" : "matches"}
          </span>
        )}
        <button
          type="button"
          onClick={collapseAll}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Collapse all
        </button>
      </div>

      <p className="text-sm text-slate-500">
        {people.length} people · {departments} departments · {teams} teams. Use
        the arrows to show or hide a person&apos;s reports; click a name for
        their details and reporting line.
      </p>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <section
          aria-label="Org chart"
          className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="max-h-[calc(100vh-16rem)] overflow-auto p-3">
            <ul>
              {roots.map((root) => (
                <ListNode key={root.id} person={root} depth={0} ctx={ctx} />
              ))}
            </ul>
          </div>
        </section>

        <aside className="w-full shrink-0 lg:sticky lg:top-24 lg:w-80">
          {selected ? (
            <PersonPanel
              person={selected}
              line={selectedLine}
              reports={childrenOf.get(selected.id) ?? []}
              onSelect={selectPerson}
              onClose={() => setSelectedId(null)}
              action={{ href: `/people/${selected.id}`, label: "Open full profile" }}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
              Select someone on the chart to see their details, their reporting
              line up to the top, and who reports to them.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

/* ─── List ──────────────────────────────────────────────────────────────── */

function ListNode({
  person,
  depth,
  ctx,
}: {
  person: Person;
  depth: number;
  ctx: Ctx;
}) {
  const kids = ctx.childrenOf.get(person.id) ?? [];
  const isCollapsed = ctx.collapsed.has(person.id);
  const style = departmentStyle(person.department);
  const isSelected = ctx.selectedId === person.id;
  const isMatch = ctx.matches?.has(person.id) ?? false;
  const dimmed = ctx.matches !== null && !isMatch;

  return (
    <li>
      <div
        ref={(el) => ctx.registerRow(person.id, el)}
        className={`flex items-center gap-1 rounded-lg pr-2 ${
          isSelected
            ? "bg-blue-50 ring-1 ring-blue-200"
            : isMatch
              ? "bg-amber-50"
              : "hover:bg-slate-50"
        } ${dimmed ? "opacity-50" : ""}`}
        style={{ paddingLeft: depth * 24 + 4 }}
      >
        {kids.length > 0 ? (
          <button
            type="button"
            onClick={() => ctx.onToggle(person.id)}
            aria-expanded={!isCollapsed}
            aria-label={`${isCollapsed ? "Show" : "Hide"} ${kids.length} direct ${
              kids.length === 1 ? "report" : "reports"
            } of ${person.name}`}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-slate-500 hover:bg-slate-200"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" aria-hidden />
            ) : (
              <ChevronDown className="h-4 w-4" aria-hidden />
            )}
          </button>
        ) : (
          <span className="h-7 w-7 shrink-0" aria-hidden />
        )}
        <button
          type="button"
          onClick={() => ctx.onSelect(person.id)}
          aria-pressed={isSelected}
          className="flex min-w-0 flex-1 items-center gap-3 py-1.5 text-left"
        >
          <Avatar name={person.name} size="sm" className={style.avatar} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-slate-900">
              {person.name}
            </span>
            <span className="block truncate text-xs text-slate-500">
              {person.title}
              {person.team ? ` · ${person.team}` : ""}
            </span>
          </span>
          <span
            className={`hidden rounded-full px-2 py-0.5 text-[10px] font-medium sm:inline ${style.badge}`}
          >
            {person.department}
          </span>
          {kids.length > 0 && (
            <span className="hidden w-20 text-right text-xs text-slate-400 md:inline">
              {kids.length} {kids.length === 1 ? "report" : "reports"}
            </span>
          )}
        </button>
      </div>
      {kids.length > 0 && !isCollapsed && (
        <ul>
          {kids.map((kid) => (
            <ListNode key={kid.id} person={kid} depth={depth + 1} ctx={ctx} />
          ))}
        </ul>
      )}
    </li>
  );
}

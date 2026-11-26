import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { departmentsFor, listSopsFor, publishableDepartments } from "@/lib/sops";
import { SopList } from "@/components/sop-list";

export const metadata: Metadata = { title: "SOPs" };

export default async function DocsPage() {
  const user = await requireUser();
  const sops = listSopsFor(user);
  const mine = departmentsFor(user);
  const present = new Set(sops.flatMap((s) => s.departments));
  const filters = mine.filter((d) => present.has(d));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">SOPs</h1>
          <p className="text-sm text-slate-500">
            Standard operating procedures for{" "}
            {mine.length ? mine.join(", ") : "your departments"}. You only see SOPs for departments you work in or lead.
          </p>
        </div>
        {publishableDepartments(user).length > 0 && (
          <Link
            href="/docs/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" aria-hidden /> New SOP
          </Link>
        )}
      </div>
      <SopList
        departments={filters}
        sops={sops.map(({ id, title, summary, departments, authorName, updatedAt, version }) => ({
          id,
          title,
          summary,
          departments,
          authorName,
          updatedAt,
          version,
        }))}
      />
    </div>
  );
}

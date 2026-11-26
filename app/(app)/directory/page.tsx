import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getAllPeople, getDepartments, getDirectReports, getManager } from "@/lib/org";
import { DirectoryTable, type DirectoryRow } from "@/components/directory-table";

export const metadata: Metadata = { title: "Directory" };

export default async function DirectoryPage() {
  await requireUser();
  const rows: DirectoryRow[] = getAllPeople()
    .map((p) => ({
      ...p,
      managerName: getManager(p)?.name ?? null,
      reportCount: getDirectReports(p.id).length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Directory</h1>
        <p className="text-sm text-slate-500">Everyone on site, with who they report to.</p>
      </div>
      <DirectoryTable rows={rows} departments={getDepartments()} />
    </div>
  );
}

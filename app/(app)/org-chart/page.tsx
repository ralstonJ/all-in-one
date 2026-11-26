import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getAllPeople } from "@/lib/org";
import { COMPANY } from "@/lib/data/people";
import { OrgChart } from "@/components/org-chart";

export const metadata: Metadata = { title: "Org Chart" };

export default async function OrgChartPage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string }>;
}) {
  await requireUser();
  const { focus } = await searchParams;
  const people = getAllPeople();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Org Chart
        </h1>
        <p className="text-sm text-slate-500">{COMPANY.name}</p>
      </div>
      <OrgChart people={people} initialFocusId={focus} />
    </div>
  );
}

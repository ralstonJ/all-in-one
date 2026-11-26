import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { publishableDepartments } from "@/lib/sops";
import { SopEditor } from "@/components/sop-editor";

export const metadata: Metadata = { title: "New SOP" };

export default async function NewSopPage() {
  const user = await requireUser();
  const departments = publishableDepartments(user);

  return (
    <div className="space-y-4">
      <Link href="/docs" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" aria-hidden /> SOPs
      </Link>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="mb-5 text-2xl font-semibold tracking-tight text-slate-900">New SOP</h1>
        {departments.length ? (
          <SopEditor departments={departments} defaultDepartment={user.person?.department} />
        ) : (
          <p className="text-sm text-slate-500">This account isn&apos;t in a department, so it can&apos;t publish SOPs.</p>
        )}
      </section>
    </div>
  );
}

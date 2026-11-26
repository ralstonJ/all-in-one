import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { canEdit, getSop, publishableDepartments } from "@/lib/sops";
import { SopEditor } from "@/components/sop-editor";

export const metadata: Metadata = { title: "Edit SOP" };

export default async function EditSopPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const sop = getSop((await params).id);
  if (!sop || !canEdit(user, sop)) notFound();
  const departments = publishableDepartments(user);

  return (
    <div className="space-y-4">
      <Link href={`/docs/${sop.id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back to SOP
      </Link>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="mb-5 text-2xl font-semibold tracking-tight text-slate-900">Edit SOP</h1>
        <SopEditor
          sop={sop}
          departments={departments}
          lockedDepartments={sop.departments.filter((d) => !departments.includes(d))}
        />
      </section>
    </div>
  );
}

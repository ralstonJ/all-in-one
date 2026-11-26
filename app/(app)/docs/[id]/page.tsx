import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Users } from "lucide-react";
import { requireUser, getCurrentUser } from "@/lib/auth";
import { canEdit, canRead, getSop } from "@/lib/sops";
import { Markdown } from "@/components/markdown";
import { DeleteSopButton } from "@/components/delete-sop-button";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const user = await getCurrentUser();
  const sop = getSop((await params).id);
  return { title: user && sop && canRead(user, sop) ? sop.title : "SOP" };
}

export default async function SopPage({ params }: { params: Params }) {
  const user = await requireUser();
  const sop = getSop((await params).id);
  // Not-found rather than forbidden, so other departments' SOPs aren't revealed.
  if (!sop || !canRead(user, sop)) notFound();
  const editable = canEdit(user, sop);
  const date = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="space-y-4">
      <Link href="/docs" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" aria-hidden /> SOPs
      </Link>

      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{sop.title}</h1>
            {sop.summary && <p className="mt-1 text-slate-600">{sop.summary}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {sop.departments.length > 1 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                  <Users className="h-3 w-3" aria-hidden /> Shared
                </span>
              )}
              {sop.departments.map((d) => (
                <span key={d} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                  {d}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Version {sop.version} · written by {sop.authorName} · last updated {date(sop.updatedAt)} by {sop.updatedBy}
            </p>
          </div>
          {editable && (
            <div className="flex gap-2">
              <Link
                href={`/docs/${sop.id}/edit`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Pencil className="h-4 w-4" aria-hidden /> Edit
              </Link>
              <DeleteSopButton id={sop.id} title={sop.title} />
            </div>
          )}
        </header>
        <div className="max-w-3xl pt-4">
          <Markdown>{sop.body}</Markdown>
        </div>
      </article>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getPerson } from "@/lib/org";
import { PersonProfile } from "@/components/person-profile";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const person = getPerson(id);
  return { title: person ? person.name : "Person not found" };
}

export default async function PersonPage({ params }: { params: Params }) {
  await requireUser();
  const { id } = await params;
  const person = getPerson(id);
  if (!person) notFound();

  return (
    <div className="space-y-4">
      <Link
        href="/directory"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Directory
      </Link>
      <PersonProfile person={person} />
    </div>
  );
}

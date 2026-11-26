import Link from "next/link";

export default function AxxionNotFound() {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Not found</h1>
      <p className="text-sm text-slate-500">That claim doesn&apos;t exist or isn&apos;t one of yours.</p>
      <Link href="/axxion/home" className="rounded-lg bg-[#0b1f3a] px-4 py-2 text-sm font-medium text-white">
        Back to home
      </Link>
    </div>
  );
}

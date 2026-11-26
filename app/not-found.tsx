import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Page not found</h1>
      <p className="text-sm text-slate-500">That page or person does not exist.</p>
      <Link href="/home" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
        Go home
      </Link>
    </main>
  );
}

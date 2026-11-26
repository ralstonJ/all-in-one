import type { Metadata } from "next";
import { COMPANY } from "@/lib/data/people";
import { LoginForm } from "@/app/login/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-sky-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-lg font-bold text-white shadow">
            A1
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            All-in-One
          </h1>
          <p className="mt-1 text-sm text-slate-500">{COMPANY.name}</p>
        </div>
        <LoginForm next={next ?? ""} />
      </div>
    </main>
  );
}

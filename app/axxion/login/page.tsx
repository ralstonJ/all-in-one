import type { Metadata } from "next";
import { AX_ACCOUNTS, ROLE_LABEL } from "@/lib/axxion/accounts";
import { AxLoginForm } from "@/app/axxion/login/login-form";

export const metadata: Metadata = { title: { absolute: "Sign in · Axxion Claims" } };

export default async function AxxionLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const groups = (["handler", "surveyor", "head", "workshop", "admin"] as const).map((role) => ({
    role,
    label: ROLE_LABEL[role],
    accounts: AX_ACCOUNTS.filter((a) => a.role === role).map((a) => ({ username: a.username, name: a.name })),
  }));
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0b1f3a] via-[#11305a] to-[#0e6b75] px-4 py-10">
      <div className="w-full max-w-4xl">
        <div className="mb-6 text-center text-white">
          <p className="text-3xl font-bold tracking-[0.2em]">AXXION</p>
          <p className="mt-1 text-sm text-sky-100">Motor claims portal</p>
        </div>
        <AxLoginForm next={next ?? ""} groups={groups} />
      </div>
    </main>
  );
}

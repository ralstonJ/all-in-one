import Link from "next/link";
import { LogOut } from "lucide-react";
import { requireAxUser } from "@/lib/axxion/session";
import { ROLE_LABEL } from "@/lib/axxion/accounts";
import { axLogout } from "@/app/actions/axxion";
import { Avatar } from "@/components/avatar";

export default async function AxxionPortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAxUser();
  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <header className="sticky top-0 z-40 bg-[#0b1f3a] text-white shadow">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/axxion/home" className="flex items-baseline gap-2">
            <span className="text-lg font-bold tracking-[0.2em]">AXXION</span>
            <span className="hidden text-sm text-sky-200 sm:inline">Claims</span>
          </Link>
          <div className="flex items-center gap-3">
            {user.role === "admin" && (
              <nav aria-label="Admin" className="mr-2 flex items-center gap-1 text-sm">
                <Link href="/axxion/home" className="rounded-lg px-3 py-1.5 text-sky-100 hover:bg-white/10">
                  Dashboard
                </Link>
                <Link href="/axxion/sla" className="rounded-lg px-3 py-1.5 text-sky-100 hover:bg-white/10">
                  SLAs
                </Link>
              </nav>
            )}
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{user.name}</p>
              <p className="text-xs text-sky-200">
                {ROLE_LABEL[user.role]}
                {user.emirate ? ` · ${user.emirate}` : ""}
              </p>
            </div>
            <Avatar name={user.name} size="sm" className="bg-teal-500 text-white" />
            <form action={axLogout}>
              <button
                aria-label="Sign out"
                title="Sign out"
                className="rounded-full p-2 text-sky-100 hover:bg-white/10"
              >
                <LogOut className="h-4 w-4" aria-hidden />
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}

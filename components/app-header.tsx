"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appForPath, type AppDef } from "@/lib/apps";
import { AppLauncher } from "@/components/app-launcher";
import { UserMenu, type HeaderUser } from "@/components/user-menu";

export function AppHeader({
  user,
  apps,
}: {
  user: HeaderUser;
  apps: AppDef[];
}) {
  const pathname = usePathname();
  const current = appForPath(pathname);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/home"
            className="flex items-center gap-2 rounded-lg px-1 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">
              A1
            </span>
            <span className="hidden text-lg font-semibold tracking-tight text-slate-900 sm:inline">
              All-in-One
            </span>
          </Link>
          {current && (
            <>
              <span className="hidden text-slate-300 sm:inline" aria-hidden>
                /
              </span>
              <span className="truncate text-lg text-slate-600">{current.name}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <AppLauncher apps={apps} />
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}

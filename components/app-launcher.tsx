"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Building,
  CalendarCheck,
  CalendarRange,
  BookOpen,
  Gauge,
  Cog,
  Clock,
  ClipboardCheck,
  CalendarDays,
  CircleUser,
  House,
  Network,
  Package,
  ShieldCheck,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { AppDef, AppIconKey } from "@/lib/apps";

const ICONS: Record<AppIconKey, LucideIcon> = {
  home: House,
  "org-chart": Network,
  directory: Users,
  departments: Building,
  profile: CircleUser,
  admin: ShieldCheck,
  attendance: CalendarCheck,
  labour: Gauge,
  "parts-usage": Cog,
  clock: Clock,
  approvals: ClipboardCheck,
  calendar: CalendarRange,
  docs: BookOpen,
  jobs: Wrench,
  bookings: CalendarDays,
  parts: Package,
};

export function AppIcon({
  icon,
  className,
}: {
  icon: AppIconKey;
  className?: string;
}) {
  const Icon = ICONS[icon];
  return <Icon className={className} aria-hidden />;
}

/** Google-style 3×3 dot grid. */
function NineDots({ className }: { className?: string }) {
  const points = [4, 12, 20];
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      {points.flatMap((y) =>
        points.map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2.1" />),
      )}
    </svg>
  );
}

export function AppLauncher({ apps }: { apps: AppDef[] }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="All-in-One apps"
        aria-haspopup="dialog"
        aria-expanded={open}
        title="All-in-One apps"
        className={`flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
          open ? "bg-slate-100" : ""
        }`}
      >
        <NineDots className="h-6 w-6" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Apps"
          className="fixed inset-x-2 top-[4.5rem] z-50 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-[22rem]"
        >
          <div className="grid grid-cols-3 gap-1">
            {apps.map((app) => {
              const active =
                app.href !== "#" &&
                (pathname === app.href || pathname.startsWith(app.href + "/"));
              const tile = (
                <>
                  <span
                    className={`relative flex h-12 w-12 items-center justify-center rounded-full ${app.tile}`}
                  >
                    <AppIcon icon={app.icon} className="h-6 w-6" />
                    {!!app.badge && (
                      <span
                        className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-semibold text-white ring-2 ring-white"
                        aria-label={`${app.badge} pending`}
                      >
                        {app.badge}
                      </span>
                    )}
                  </span>
                  <span className="text-xs font-medium text-slate-800">
                    {app.name}
                  </span>
                  {app.comingSoon && (
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                      Soon
                    </span>
                  )}
                </>
              );
              const classes = `flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-center transition ${
                active ? "bg-blue-50 ring-1 ring-blue-200" : "hover:bg-slate-100"
              }`;
              return app.comingSoon ? (
                <div
                  key={app.id}
                  aria-disabled
                  title={`${app.name}: coming soon`}
                  className={`${classes} cursor-not-allowed opacity-70 hover:bg-transparent`}
                >
                  {tile}
                </div>
              ) : (
                <Link
                  key={app.id}
                  href={app.href}
                  aria-current={active ? "page" : undefined}
                  title={app.description}
                  onClick={() => setOpen(false)}
                  className={classes}
                >
                  {tile}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

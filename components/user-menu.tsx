"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LogOut, CircleUser } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { Avatar } from "@/components/avatar";

export type HeaderUser = {
  displayName: string;
  username: string;
  role: "admin" | "user";
  personTitle: string | null;
};

export function UserMenu({ user }: { user: HeaderUser }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

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
        aria-label={`Account: ${user.displayName}`}
        aria-haspopup="menu"
        aria-expanded={open}
        className="rounded-full ring-offset-2 transition hover:ring-2 hover:ring-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
      >
        <Avatar
          name={user.displayName}
          size="sm"
          className={
            user.role === "admin"
              ? "bg-rose-600 text-white"
              : "bg-slate-800 text-white"
          }
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        >
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-4">
            <Avatar
              name={user.displayName}
              size="lg"
              className={
                user.role === "admin"
                  ? "bg-rose-600 text-white"
                  : "bg-slate-800 text-white"
              }
            />
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-900">
                {user.displayName}
              </p>
              <p className="truncate text-sm text-slate-500">
                {user.personTitle ?? "Account"} · @{user.username}
              </p>
              <span
                className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${
                  user.role === "admin"
                    ? "bg-rose-50 text-rose-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {user.role}
              </span>
            </div>
          </div>
          <div className="p-1.5">
            <Link
              href="/profile"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              <CircleUser className="h-4 w-4" aria-hidden /> My profile
            </Link>
            <form action={logout}>
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
              >
                <LogOut className="h-4 w-4" aria-hidden /> Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

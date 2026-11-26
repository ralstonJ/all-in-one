"use client";

import { useEffect, useState } from "react";

/** Live time left until a deadline; amber under 2h, red under 30 min. */
export function Countdown({ from, until, label = "left to quote" }: { from: string; until: string; label?: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  if (now === null) return <span className="text-xs text-slate-400">…</span>;
  const end = new Date(until).getTime();
  const left = end - now;
  if (left <= 0) return <span className="text-xs font-medium text-slate-500">Deadline passed</span>;
  const total = Math.max(1, end - new Date(from).getTime());
  const h = Math.floor(left / 3600_000);
  const m = Math.floor((left % 3600_000) / 60_000);
  const pct = Math.max(0, Math.min(100, (left / total) * 100));
  const [bar, ink] = left < 30 * 60_000 ? ["bg-rose-500", "text-rose-700"] : left < 2 * 3600_000 ? ["bg-amber-500", "text-amber-800"] : ["bg-emerald-500", "text-emerald-800"];
  return (
    <span className="inline-flex min-w-[9rem] flex-col gap-1">
      <span className={`text-xs font-semibold tabular-nums ${ink}`}>
        {h >= 24 ? `${Math.floor(h / 24)}d ${h % 24}h` : `${h}h ${String(m).padStart(2, "0")}m`} {label}
      </span>
      <span className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100" aria-hidden>
        <span className={`block h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
      </span>
    </span>
  );
}

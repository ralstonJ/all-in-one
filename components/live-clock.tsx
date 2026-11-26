"use client";

import { useEffect, useState } from "react";

function fmt(d: Date) {
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/** Ticking wall clock plus, when `since` is set, a running "on the clock" timer. */
export function LiveClock({ since }: { since: string | null }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const elapsed =
    now && since ? Math.max(0, Math.floor((now.getTime() - new Date(since).getTime()) / 1000)) : null;
  const h = elapsed !== null ? Math.floor(elapsed / 3600) : 0;
  const m = elapsed !== null ? Math.floor((elapsed % 3600) / 60) : 0;
  const s = elapsed !== null ? elapsed % 60 : 0;

  return (
    <div>
      <p className="text-5xl font-semibold tabular-nums tracking-tight text-slate-900" suppressHydrationWarning>
        {now ? fmt(now) : "--:--:--"}
      </p>
      <p className="mt-1 text-sm text-slate-500" suppressHydrationWarning>
        {now
          ? now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
          : " "}
      </p>
      {elapsed !== null && (
        <p className="mt-3 text-sm font-medium text-emerald-700 tabular-nums">
          On the clock for {h}h {String(m).padStart(2, "0")}m {String(s).padStart(2, "0")}s
        </p>
      )}
    </div>
  );
}

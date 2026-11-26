import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireBusinessViewer } from "@/lib/auth";
import { departmentStyle } from "@/lib/org";
import { Avatar } from "@/components/avatar";
import {
  LABOUR_MONTHS,
  LABOUR_TARGET,
  LABOUR_YEAR,
  USAGE_BINS,
  getLabourSummary,
  getTradeUsage,
  usageBin,
} from "@/lib/labour";

export const metadata: Metadata = { title: "Labour Usage" };

const pct = (v: number) => `${Math.round(v)}%`;

export default async function LabourPage() {
  await requireBusinessViewer();
  const summary = getLabourSummary();
  const trades = getTradeUsage();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/home"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Home
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Labour usage</h1>
        <p className="text-sm text-slate-500">
          Share of available hours booked to jobs · Jan–{summary.current.month} {LABOUR_YEAR} ·
          target {LABOUR_TARGET}%
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Year to date" value={pct(summary.average)} />
        <Stat label={`${summary.current.month} so far`} value={pct(summary.current.value)} />
        <Stat
          label="Busiest month"
          value={`${summary.busiestMonth.month} · ${pct(summary.busiestMonth.value)}`}
        />
        <Stat
          label="Hours booked"
          value={Math.round(summary.bookedHours).toLocaleString("en-GB")}
        />
      </dl>

      <Legend />

      <Heatmap
        title="By trade"
        caption="Average across everyone in the trade. Body shop peaks mid-year; EV high-voltage work has climbed all year."
        rows={trades.map((t) => ({
          key: t.trade,
          label: <span className="font-medium text-slate-900">{t.trade}</span>,
          sub: `${t.people.length} ${t.people.length === 1 ? "person" : "people"}`,
          months: t.months,
          average: t.average,
        }))}
      />

      {trades.map((t) => (
        <Heatmap
          key={t.trade}
          title={t.trade}
          caption="Busiest first."
          rows={t.people.map((p) => ({
            key: p.person.id,
            label: (
              <Link
                href={`/people/${p.person.id}`}
                className="flex items-center gap-2 hover:underline"
              >
                <Avatar
                  name={p.person.name}
                  size="sm"
                  className={departmentStyle(p.person.department).avatar}
                />
                <span className="font-medium text-slate-900">{p.person.name}</span>
              </Link>
            ),
            sub: p.person.team ?? p.person.department,
            months: p.months,
            average: p.average,
          }))}
        />
      ))}
    </div>
  );
}

type Row = {
  key: string;
  label: React.ReactNode;
  sub: string;
  months: number[];
  average: number;
};

function Heatmap({ title, caption, rows }: { title: string; caption: string; rows: Row[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="font-medium text-slate-900">{title}</h2>
        <p className="text-xs text-slate-500">{caption}</p>
      </div>
      <div className="overflow-x-auto px-5 py-4">
        <table className="w-full min-w-[46rem] border-separate border-spacing-0.5 text-sm">
          <thead>
            <tr className="text-xs text-slate-500">
              <th scope="col" className="w-52 pb-1 text-left font-medium">
                <span className="sr-only">Name</span>
              </th>
              {LABOUR_MONTHS.map((m) => (
                <th key={m} scope="col" className="pb-1 text-center font-medium">
                  {m}
                </th>
              ))}
              <th scope="col" className="w-16 pb-1 pl-2 text-right font-medium">
                Year
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <th scope="row" className="py-1 pr-3 text-left font-normal">
                  {r.label}
                  <span className="block truncate text-xs text-slate-500">{r.sub}</span>
                </th>
                {r.months.map((v, i) => {
                  const bin = usageBin(v);
                  return (
                    <td
                      key={i}
                      title={`${LABOUR_MONTHS[i]}: ${pct(v)} booked`}
                      className="h-9 rounded text-center text-xs font-medium tabular-nums"
                      style={{ backgroundColor: bin.fill, color: bin.ink }}
                    >
                      {Math.round(v)}
                    </td>
                  );
                })}
                <td className="pl-2 text-right font-semibold tabular-nums text-slate-900">
                  {pct(r.average)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600">
      <span className="font-medium text-slate-700">Hours booked:</span>
      {USAGE_BINS.map((b) => (
        <span key={b.label} className="inline-flex items-center gap-1.5">
          <span className="h-3 w-5 rounded-sm" style={{ backgroundColor: b.fill }} aria-hidden />
          {b.label}
        </span>
      ))}
      <span className="text-slate-400">Darker means busier. Hover a cell for details.</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{value}</dd>
    </div>
  );
}

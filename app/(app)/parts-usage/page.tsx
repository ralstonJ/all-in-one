import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireBusinessViewer } from "@/lib/auth";
import { PARTS_CURRENCY, PARTS_MONTHS, formatMoney, getPartsSummary } from "@/lib/parts";

export const metadata: Metadata = { title: "Parts Used" };

const BAR = "#3987e5"; // sequential blue 400
const BAR_EMPHASIS = "#1c5cab"; // sequential blue 550

export default async function PartsUsagePage() {
  await requireBusinessViewer();
  const s = getPartsSummary();
  const maxMonth = Math.max(...s.monthly);
  const maxCategory = s.categories[0].total;
  const last = s.monthly.length - 1;
  const fastest = [...s.categories].sort((a, b) => b.growth - a.growth)[0];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/home"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Home
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Auto spare parts used
        </h1>
        <p className="text-sm text-slate-500">
          Value of parts used on jobs, at cost · Jan–{s.current.month} {s.year} · {PARTS_CURRENCY}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Year to date" value={formatMoney(s.total, true)} />
        <Stat
          label={`${s.current.month} so far`}
          value={formatMoney(s.current.value, true)}
          note={`${s.changeVsPrevious >= 0 ? "+" : "−"}${Math.abs(Math.round(s.changeVsPrevious * 100))}% on ${s.previous.month}`}
        />
        <Stat label="Monthly average" value={formatMoney(s.averageMonth, true)} />
        <Stat label="Peak month" value={`${s.peak.month} · ${formatMoney(s.peak.value, true)}`} />
      </dl>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-medium text-slate-900">Parts used per month</h2>
        <p className="text-xs text-slate-500">
          July was the peak, driven by body shop work. {s.current.month} is the highest since.
        </p>
        <div className="mt-6 flex h-56 items-end gap-0.5 border-b border-slate-200">
          {s.monthly.map((v, i) => {
            const labelled = i === last || PARTS_MONTHS[i] === s.peak.month;
            return (
              <div
                key={PARTS_MONTHS[i]}
                className="group relative flex h-full flex-1 flex-col justify-end"
                title={`${PARTS_MONTHS[i]}: ${formatMoney(v)}`}
              >
                <span
                  className={`mb-1 text-center text-[11px] tabular-nums text-slate-600 ${
                    labelled ? "" : "invisible group-hover:visible"
                  }`}
                >
                  {formatMoney(v, true)}
                </span>
                <span
                  className="block rounded-t"
                  style={{
                    height: `${(v / maxMonth) * 85}%`,
                    backgroundColor: i === last ? BAR_EMPHASIS : BAR,
                  }}
                />
              </div>
            );
          })}
        </div>
        <div className="mt-1 flex gap-0.5 text-[11px] text-slate-500">
          {PARTS_MONTHS.map((m) => (
            <span key={m} className="flex-1 text-center">
              {m}
            </span>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-3">
          <h2 className="font-medium text-slate-900">By category</h2>
          <p className="text-xs text-slate-500">
            Year to date, largest first. {fastest.category} is the fastest growing, up{" "}
            {Math.round(fastest.growth * 100)}% from {PARTS_MONTHS[0]} to {s.current.month}.
          </p>
          <ul className="mt-4 space-y-3">
            {s.categories.map((c) => (
              <li key={c.category} title={`${c.category}: ${formatMoney(c.total)} (${Math.round(c.share * 100)}%)`}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-slate-800">
                    {c.category}
                    <span className="ml-2 text-xs text-slate-500">{c.area}</span>
                  </span>
                  <span className="shrink-0 tabular-nums text-slate-900">
                    {formatMoney(c.total, true)}{" "}
                    <span className="text-xs text-slate-500">{Math.round(c.share * 100)}%</span>
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full"
                    style={{ width: `${(c.total / maxCategory) * 100}%`, backgroundColor: BAR }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="font-medium text-slate-900">By workshop area</h2>
          <p className="text-xs text-slate-500">Where the parts were fitted.</p>
          <dl className="mt-4 space-y-3">
            {s.areas.map((a) => (
              <div key={a.area} className="rounded-xl bg-slate-50 px-4 py-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{a.area}</dt>
                <dd className="mt-1 flex items-baseline justify-between">
                  <span className="text-xl font-semibold tabular-nums text-slate-900">
                    {formatMoney(a.value, true)}
                  </span>
                  <span className="text-sm tabular-nums text-slate-600">{Math.round(a.share * 100)}%</span>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-medium text-slate-900">Top 10 parts by value</h2>
          <p className="text-xs text-slate-500">Year to date.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-5 py-3">Part</th>
                <th scope="col" className="px-5 py-3">Category</th>
                <th scope="col" className="px-5 py-3 text-right">Qty used</th>
                <th scope="col" className="px-5 py-3 text-right">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {s.topParts.map((p) => (
                <tr key={p.part} className="hover:bg-slate-50">
                  <td className="px-5 py-2.5 font-medium text-slate-900">{p.part}</td>
                  <td className="px-5 py-2.5 text-slate-600">{p.category}</td>
                  <td className="px-5 py-2.5 text-right tabular-nums text-slate-700">{p.qty}</td>
                  <td className="px-5 py-2.5 text-right tabular-nums text-slate-900">{formatMoney(p.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{value}</dd>
      {note && <p className="text-xs text-slate-500">{note}</p>}
    </div>
  );
}

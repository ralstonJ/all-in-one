import type { Metadata } from "next";
import Link from "next/link";
import { requireAxUser } from "@/lib/axxion/session";
import type { AxAccount } from "@/lib/axxion/accounts";
import { readStore } from "@/lib/axxion/store";
import type { AxStore } from "@/lib/axxion/types";
import { SLA_ACTORS, blockersFor, inboxFor, isOpen, timing, type Range } from "@/lib/axxion/workflow";
import { SLA_CLOCKS, type SlaActor } from "@/lib/axxion/sla-catalogue";
import { Blockers, ClaimLine, Inbox, SlaChips, Stat, StageBadge, TimingBadge, card, fmt, money } from "@/components/axxion/ui";
import { QuoteForm, StageAction } from "@/components/axxion/stage-action";
import { Countdown } from "@/components/axxion/countdown";
import { AdminBlockers, AdminOverview, AdminPipeline, AdminTabs, AdminTeam, type AdminTab } from "@/components/axxion/admin";

export const metadata: Metadata = { title: { absolute: "Home · Axxion Claims" } };

type Search = { range?: string; tab?: string; actor?: string; clock?: string };

export default async function AxxionHome({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await requireAxUser();
  const store = readStore();
  const now = new Date();
  const sp = await searchParams;
  const r: Range = sp.range === "week" || sp.range === "month" ? sp.range : "day";
  const hour = Number(now.toLocaleString("en-GB", { timeZone: "Asia/Dubai", hour: "2-digit", hour12: false }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"}
          {user.role === "admin" ? "" : user.role === "workshop" ? `, ${user.name}` : `, ${user.name.split(" ")[0]}`}
        </h1>
        <p className="text-sm text-slate-500">
          {now.toLocaleDateString("en-GB", { timeZone: "Asia/Dubai", weekday: "long", day: "numeric", month: "long", year: "numeric" })} · SLAs count working
          time, Mon–Sat 09:00–18:00
        </p>
      </div>
      {user.role === "handler" && <HandlerHome user={user} store={store} now={now} />}
      {user.role === "surveyor" && <SurveyorHome user={user} store={store} now={now} />}
      {user.role === "head" && <HeadHome user={user} store={store} now={now} />}
      {user.role === "workshop" && <WorkshopHome user={user} store={store} now={now} />}
      {user.role === "admin" && <AdminHome user={user} store={store} now={now} range={r} search={sp} />}
    </div>
  );
}

type P = { user: AxAccount; store: AxStore; now: Date };

function Summary({ user, store, now }: P) {
  const inbox = inboxFor(user, store.claims, now);
  const mine = store.claims.filter((c) => isOpen(c) && (user.role === "handler" ? c.handlerId === user.id : c.surveyorId === user.id));
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat label="Breached" value={inbox.filter((i) => i.timing === "breached").length} tone="rose" />
      <Stat label="Due or new today" value={inbox.filter((i) => i.timing !== "breached").length} tone="amber" />
      <Stat label="Breaches on my claims" value={blockersFor(user, store.claims, now).length} tone="rose" />
      <Stat label="My open claims" value={mine.length} />
    </div>
  );
}

function HandlerHome(p: P) {
  const { user, store, now } = p;
  return (
    <>
      <Summary {...p} />
      <Inbox
        title="Today's notifications"
        empty="Nothing breached, due or new today."
        items={inboxFor(user, store.claims, now)}
        quick={{ lpo: { type: "lpoReceived", label: "LPO received" } }}
        now={now}
      />
      <Blockers items={blockersFor(user, store.claims, now)} user={user} now={now} />
    </>
  );
}

function SurveyorHome(p: P) {
  const { user, store, now } = p;
  return (
    <>
      <Summary {...p} />
      <Inbox title="Today's notifications" empty="No surveys or quality checks due today." items={inboxFor(user, store.claims, now)} now={now} />
      <Blockers items={blockersFor(user, store.claims, now)} user={user} now={now} />
    </>
  );
}

function HeadHome({ user, store, now }: P) {
  const items = inboxFor(user, store.claims, now);
  const blockers = blockersFor(user, store.claims, now);
  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Approvals breached" value={items.filter((i) => i.timing === "breached").length} tone="rose" />
        <Stat label="Approvals due today" value={items.filter((i) => i.timing === "today").length} tone="amber" />
        <Stat label="New today" value={items.filter((i) => i.timing === "upcoming").length} />
        <Stat label="Breached SLAs (all)" value={blockers.length} tone="rose" />
      </div>

      <section className={card}>
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">Approvals for today</h2>
            <p className="text-xs text-slate-500">Survey sign-off, garage award, QC verification and fraud review: 24 working hours each.</p>
          </div>
          <span className="text-sm text-slate-500">{items.length} breached, due or new today</span>
        </div>
        {items.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">No approvals waiting.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map(({ claim, timing: t, isNew, todo }) => (
              <li key={claim.id} className="space-y-2 px-5 py-4">
                <p className="flex flex-wrap items-center gap-1.5 text-sm">
                  {isNew && <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700">New today</span>}
                  <TimingBadge claim={claim} timing={t} now={now} />
                  <StageBadge claim={claim} />
                  <SlaChips claim={claim} now={now} />
                </p>
                <p className="text-sm">
                  <span className="font-medium text-slate-900">{todo}</span> · <ClaimLine claim={claim} />
                </p>
                {claim.stage === "survey_signoff" && (
                  <p className="text-xs text-slate-500">
                    Estimate {claim.estimate ? money(claim.estimate) : "—"} · {claim.quotes.length} quotes · {claim.negotiationNotes}
                  </p>
                )}
                <StageAction claim={claim} user={user} compact />
              </li>
            ))}
          </ul>
        )}
      </section>

      <Blockers items={blockers} user={user} now={now} limit={20} />
    </>
  );
}

function WorkshopHome({ user, store, now }: P) {
  const requests = store.claims
    .filter((c) => c.stage === "quotes" && c.invited.includes(user.id) && !c.quotes.some((q) => q.workshopId === user.id))
    .sort((a, b) => (a.quoteDueAt ?? "").localeCompare(b.quoteDueAt ?? ""));
  const jobs = store.claims.filter((c) => isOpen(c) && c.awardedWorkshopId === user.id && ["car_received", "repair_dates", "parts_list", "repair", "rework", "pickup", "final_invoice"].includes(c.stage));
  const quoted = store.claims.filter((c) => c.quotes.some((q) => q.workshopId === user.id));
  const won = quoted.filter((c) => c.awardedWorkshopId === user.id).length;
  const breached = blockersFor(user, store.claims, now);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Quote requests" value={requests.length} tone="amber" />
        <Stat label="Jobs with an action" value={jobs.length} />
        <Stat label="Breached SLAs" value={breached.length} tone="rose" />
        <Stat label="Quotes won" value={`${won} / ${quoted.length}`} />
      </div>

      <section className={card}>
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Quote requests</h2>
          <p className="text-xs text-slate-500">
            Each quote window is 4 working hours. Reminders after 1 and 2 windows; the quote breaches after 3 (12 working hours).
          </p>
        </div>
        {requests.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">No open quote requests.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {requests.map((c) => (
              <li key={c.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-semibold text-slate-900">
                    <Link href={`/axxion/claims/${c.id}`} className="hover:underline">{c.id}</Link> · {c.vehicle.year} {c.vehicle.make} {c.vehicle.model}
                  </p>
                  <p className="text-slate-600">{c.incident}</p>
                  <p className="text-xs text-slate-500">{c.surveyNotes} · {c.preferredLocation}</p>
                  <p className="mt-1 flex flex-wrap gap-1.5"><SlaChips claim={c} now={now} /></p>
                </div>
                <div className="space-y-1">
                  <Countdown from={c.quoteRequestedAt!} until={c.quoteDueAt!} />
                  <p className="text-[11px] text-slate-500">Deadline {fmt(c.quoteDueAt!)} (working time)</p>
                </div>
                <QuoteForm claim={c} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={card}>
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">My jobs</h2>
          <p className="text-xs text-slate-500">Awarded repairs where it is your turn.</p>
        </div>
        {jobs.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">Nothing waiting on you.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {jobs.map((c) => (
              <li key={c.id} className="space-y-2 px-5 py-4 text-sm">
                <p className="flex flex-wrap items-center gap-1.5">
                  <TimingBadge claim={c} timing={timing(c, now)} now={now} />
                  <StageBadge claim={c} />
                  <SlaChips claim={c} now={now} />
                </p>
                <p>
                  <ClaimLine claim={c} />
                </p>
                <StageAction claim={c} user={user} compact />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={card}>
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">My quotes</h2>
        </div>
        {quoted.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">No quotes yet.</p>
        ) : (
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-5 py-2">Claim</th>
                <th scope="col" className="px-5 py-2 text-right">Your quote</th>
                <th scope="col" className="px-5 py-2">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quoted.slice(0, 15).map((c) => {
                const q = c.quotes.find((x) => x.workshopId === user.id)!;
                const [text, tone] = c.awardedWorkshopId
                  ? c.awardedWorkshopId === user.id
                    ? ["Awarded", "bg-emerald-50 text-emerald-800"]
                    : ["Not selected", "bg-slate-100 text-slate-600"]
                  : ["Decision pending", "bg-amber-50 text-amber-800"];
                return (
                  <tr key={c.id}>
                    <td className="px-5 py-2">
                      <Link href={`/axxion/claims/${c.id}`} className="font-medium text-slate-900 hover:underline">{c.id}</Link>{" "}
                      <span className="text-slate-500">{c.vehicle.make} {c.vehicle.model}</span>
                    </td>
                    <td className="px-5 py-2 text-right tabular-nums">{money(q.amount)}</td>
                    <td className="px-5 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${tone}`}>{text}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <Blockers items={breached} user={user} now={now} />
    </>
  );
}

function AdminHome({ user, store, now, range, search }: P & { range: Range; search: Search }) {
  const tab: AdminTab = search.tab === "blockers" || search.tab === "team" || search.tab === "pipeline" ? search.tab : "overview";
  const actor = search.actor && search.actor in SLA_ACTORS ? (search.actor as SlaActor) : undefined;
  const clock = search.clock && SLA_CLOCKS.some((c) => c.title === search.clock) ? search.clock : undefined;
  return (
    <>
      <AdminTabs tab={tab} blockers={blockersFor(user, store.claims, now).length} />
      {tab === "overview" && <AdminOverview user={user} store={store} now={now} />}
      {tab === "blockers" && <AdminBlockers user={user} store={store} now={now} actor={actor} clock={clock} />}
      {tab === "team" && <AdminTeam store={store} now={now} range={range} />}
      {tab === "pipeline" && <AdminPipeline store={store} now={now} />}
    </>
  );
}


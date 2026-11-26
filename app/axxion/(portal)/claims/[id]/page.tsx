import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Bell } from "lucide-react";
import { requireAxUser } from "@/lib/axxion/session";
import { getAxAccount } from "@/lib/axxion/accounts";
import { getClaim } from "@/lib/axxion/store";
import { STAGE, canRemind, canView, formatWorking, isMyTurn, isOpen, slaStatus, timing, todoFor, waitingOn } from "@/lib/axxion/workflow";
import { dubaiTime } from "@/lib/axxion/working-time";
import { SlaChips, StageBadge, TimingBadge, card, fmt, money } from "@/components/axxion/ui";
import { StageAction } from "@/components/axxion/stage-action";
import { ActionForm } from "@/components/axxion/action-form";
import { Countdown } from "@/components/axxion/countdown";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return { title: { absolute: `${(await params).id} · Axxion Claims` } };
}

export default async function ClaimPage({ params }: { params: Params }) {
  const user = await requireAxUser();
  const claim = getClaim((await params).id);
  if (!claim || !canView(user, claim)) notFound();
  const now = new Date();
  const t = timing(claim, now);
  const sla = slaStatus(claim, now);
  const waiting = waitingOn(claim);
  const myTurn = isMyTurn(user, claim);
  const seeAll = user.role !== "workshop";
  const quotes = (seeAll ? claim.quotes : claim.quotes.filter((q) => q.workshopId === user.id)).slice().sort((a, b) => a.amount - b.amount);
  const lowest = quotes[0]?.amount;

  return (
    <div className="space-y-4">
      <Link href="/axxion/home" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Home
      </Link>

      <section className={`${card} p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{claim.id}</h1>
            <p className="text-slate-600">
              {claim.vehicle.year} {claim.vehicle.make} {claim.vehicle.model} · {claim.vehicle.plate}
            </p>
            <p className="mt-2 flex flex-wrap items-center gap-1.5">
              <StageBadge claim={claim} />
              {t !== "done" && <TimingBadge claim={claim} timing={t} now={now} />}
              <SlaChips claim={claim} now={now} />
            </p>
          </div>
          {isOpen(claim) && (
            <div className="text-right text-sm">
              <p className="text-slate-500">Waiting on</p>
              <p className="font-semibold text-slate-900">{waiting.label}</p>
              {claim.stage === "quotes" && claim.quoteDueAt && (
                <div className="mt-2">
                  <Countdown from={claim.quoteRequestedAt!} until={claim.quoteDueAt} />
                </div>
              )}
            </div>
          )}
        </div>
        {claim.stage === "rejected" && <p className="mt-4 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">Rejected: {claim.rejectedReason}</p>}
        <dl className="mt-5 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Insurer", claim.insurer],
            ["Policy", claim.policyNo],
            ["Insured", claim.insured],
            ["Phone", claim.phone],
            ["Incident", claim.incident],
            ["Incident date", fmt(claim.incidentDate)],
            ["Claims handler", getAxAccount(claim.handlerId)?.name ?? "—"],
            ["Surveyor", getAxAccount(claim.surveyorId)?.name ?? "Not assigned"],
            ["Estimate", claim.estimate ? money(claim.estimate) : "—"],
            ["Repair location", claim.preferredLocation ?? "—"],
            ["Awarded garage", getAxAccount(claim.awardedWorkshopId)?.name ?? "—"],
            ["Expected completion", claim.expectedCompletion ? fmt(claim.expectedCompletion) : "—"],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs uppercase tracking-wide text-slate-500">{k}</dt>
              <dd className="text-slate-900">{v}</dd>
            </div>
          ))}
        </dl>
        {claim.surveyNotes && <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">Survey: {claim.surveyNotes}</p>}
        {claim.invoiceFlag && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">Invoice flagged: {claim.invoiceFlag}</p>}
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {isOpen(claim) && sla.clock && (
            <section className={`${card} p-5 ${sla.breached ? "border-rose-200" : ""}`}>
              <h2 className="font-semibold text-slate-900">SLA: {sla.clock.title}</h2>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Started</dt>
                  <dd className="text-slate-900">{dubaiTime(claim.stageSince)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Breaches</dt>
                  <dd className={sla.breached ? "font-semibold text-rose-700" : "text-slate-900"}>
                    {dubaiTime(claim.dueAt)}
                    <span className="block text-xs font-normal text-slate-500">
                      {sla.breached ? `${formatWorking(sla.lateBy)} late (working time)` : `${formatWorking(sla.leftHours)} of working time left`}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Escalates to</dt>
                  <dd className="text-slate-900">{sla.escalation}</dd>
                </div>
              </dl>
              <ul className="mt-3 space-y-1 text-xs text-slate-600">
                {sla.reminderTimes.map((rt, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <Bell className={`h-3.5 w-3.5 ${rt <= now ? "text-amber-600" : "text-slate-300"}`} aria-hidden />
                    Automatic reminder to {sla.remindTo?.toLowerCase()} {rt <= now ? "sent" : "due"} {dubaiTime(rt)}
                  </li>
                ))}
                {sla.breached && <li className="font-medium text-rose-700">Breach recorded and escalated to {sla.escalation} at {dubaiTime(claim.dueAt)}.</li>}
              </ul>
            </section>
          )}

          {isOpen(claim) && (myTurn || canRemind(user, claim)) && (
            <section className={`${card} p-5`}>
              <h2 className="font-semibold text-slate-900">{myTurn ? (claim.stage === "lpo" ? `Record the LPO from ${claim.insurer}` : todoFor(claim)) : "Nudge the owner"}</h2>
              <div className="mt-3 space-y-3">
                {myTurn && <StageAction claim={claim} user={user} />}
                {!myTurn && canRemind(user, claim) && (
                  <div className="text-sm text-slate-600">
                    <p>
                      Send a manual reminder to <span className="font-medium text-slate-900">{waiting.label}</span>. It is logged on the claim; automatic reminders and
                      escalation happen anyway.
                    </p>
                    <ActionForm claimId={claim.id} type="remind" className="mt-2 flex items-center gap-2">
                      <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                        <Bell className="h-4 w-4" aria-hidden /> Send reminder
                      </button>
                    </ActionForm>
                  </div>
                )}
              </div>
            </section>
          )}

          {(claim.quotes.length > 0 || claim.invited.length > 0) && (
            <section className={`${card} overflow-hidden`}>
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="font-semibold text-slate-900">{seeAll ? `Quotes (${claim.quotes.length} of ${claim.invited.length} invited)` : "Your quote"}</h2>
                {claim.quoteRequestedAt && (
                  <p className="text-xs text-slate-500">
                    Requested {fmt(claim.quoteRequestedAt)} · quote deadline {claim.quoteDueAt ? fmt(claim.quoteDueAt) : "—"} (3 quote windows of 4 working hours)
                  </p>
                )}
              </div>
              {quotes.length === 0 ? (
                <p className="px-5 py-6 text-sm text-slate-500">{seeAll ? "No quotes yet." : "You haven't quoted yet."}</p>
              ) : (
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th scope="col" className="px-5 py-2">Garage</th>
                      <th scope="col" className="px-5 py-2 text-right">Quote</th>
                      <th scope="col" className="px-5 py-2 text-right">Days</th>
                      <th scope="col" className="px-5 py-2">Submitted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {quotes.map((q) => (
                      <tr key={q.workshopId}>
                        <td className="px-5 py-2 font-medium text-slate-900">
                          {getAxAccount(q.workshopId)?.name}
                          {q.workshopId === claim.awardedWorkshopId && <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-800">Awarded</span>}
                          {seeAll && q.amount === lowest && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">Lowest</span>}
                        </td>
                        <td className="px-5 py-2 text-right tabular-nums">{money(q.amount)}</td>
                        <td className="px-5 py-2 text-right tabular-nums">{q.days}</td>
                        <td className="px-5 py-2 text-slate-500">{fmt(q.submittedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          )}
        </div>

        <section className={`${card} p-5`}>
          <h2 className="font-semibold text-slate-900">Timeline</h2>
          <ol className="relative ml-2 mt-3 space-y-3 border-l-2 border-slate-200 pl-4 text-sm">
            {[...claim.events]
              .filter((e) => user.role !== "workshop" || e.actorId === user.id || e.actorId === "system" || e.action !== "Quote submitted")
              .reverse()
              .map((e, i) => (
                <li key={i} className="relative">
                  <span aria-hidden className={`absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white ${e.action.includes("breached") ? "bg-rose-500" : "bg-slate-400"}`} />
                  <p className="font-medium text-slate-900">{e.action}</p>
                  <p className="text-xs text-slate-500">
                    {fmt(e.at)} · {e.actorId === "system" ? "ClaimOS" : getAxAccount(e.actorId)?.name ?? e.actorId}
                  </p>
                  {e.note && <p className="text-xs text-slate-600">{e.note}</p>}
                </li>
              ))}
          </ol>
          <p className="mt-4 text-xs text-slate-400">Step labels follow ClaimOS: {STAGE[claim.stage].label}.</p>
        </section>
      </div>
    </div>
  );
}

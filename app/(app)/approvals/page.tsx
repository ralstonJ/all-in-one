import type { Metadata } from "next";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { requireUser, toViewer } from "@/lib/auth";
import { departmentStyle, getDirectReports, getManager, getPerson } from "@/lib/org";
import { decideAction } from "@/app/actions/time";
import { dateKey, getApprovals, pendingFor, type Approval } from "@/lib/time-store";
import { TYPE_LABEL, TYPE_STYLE, requestSummary } from "@/lib/requests";
import { Avatar } from "@/components/avatar";
import { RequestForm } from "@/components/request-form";

export const metadata: Metadata = { title: "Approvals" };

const STATUS_STYLE: Record<Approval["status"], string> = {
  pending: "bg-slate-100 text-slate-700",
  approved: "bg-emerald-50 text-emerald-800",
  rejected: "bg-rose-50 text-rose-700",
};

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default async function ApprovalsPage() {
  const user = await requireUser();
  const viewer = toViewer(user);
  const all = getApprovals();
  const waiting = pendingFor(viewer);
  const isApprover = viewer.isAdmin || (!!user.person && getDirectReports(user.person.id).length > 0);
  const mine = user.person ? all.filter((a) => a.personId === user.person!.id) : [];
  const decidedByMe = all
    .filter((a) => a.status !== "pending" && a.decidedBy === user.displayName && a.personId !== user.person?.id)
    .slice(0, 8);

  const manager = user.person ? getManager(user.person) : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Approvals</h1>
        <p className="text-sm text-slate-500">
          {viewer.isAdmin
            ? "As an administrator you can decide any pending request."
            : isApprover
              ? "Requests from your direct reports come to you. Your own requests go to your manager."
              : "Your requests and what your manager decided."}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">

      {isApprover && (
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-baseline justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-medium text-slate-900">Waiting for you</h2>
          <span className="text-sm text-slate-500">{waiting.length} pending</span>
        </div>
        {waiting.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">Nothing waiting for your approval.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {waiting.map((a) => {
              const person = getPerson(a.personId);
              const approver = a.approverId ? getPerson(a.approverId) : undefined;
              return (
                <li key={a.id} className="flex flex-col gap-3 px-5 py-4 2xl:flex-row 2xl:items-start">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    {person && (
                      <Avatar name={person.name} size="md" className={departmentStyle(person.department).avatar} />
                    )}
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2">
                        <Link href={`/people/${a.personId}`} className="font-medium text-slate-900 hover:underline">
                          {person?.name ?? a.personId}
                        </Link>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${TYPE_STYLE[a.type]}`}>
                          {TYPE_LABEL[a.type]}
                        </span>
                      </p>
                      <p className="text-xs text-slate-500">
                        {person?.title}
                        {person?.team ? ` · ${person.team}` : ""} · sent {when(a.submittedAt)}
                        {viewer.isAdmin && approver && approver.id !== viewer.personId
                          ? ` · normally approved by ${approver.name}`
                          : ""}
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-800">{requestSummary(a)}</p>
                      <p className="text-sm text-slate-600">&ldquo;{a.reason}&rdquo;</p>
                    </div>
                  </div>
                  <form action={decideAction} className="flex w-full flex-col gap-2 sm:flex-row sm:items-center 2xl:w-72 2xl:flex-col 2xl:items-stretch">
                    <input type="hidden" name="id" value={a.id} />
                    <input
                      name="note"
                      placeholder="Note (optional)"
                      aria-label={`Note for ${person?.name ?? "this request"}`}
                      maxLength={300}
                      className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 2xl:flex-none"
                    />
                    <div className="flex gap-2 sm:w-56 2xl:w-auto">
                      <button
                        type="submit"
                        name="decision"
                        value="approved"
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
                      >
                        <Check className="h-4 w-4" aria-hidden /> Approve
                      </button>
                      <button
                        type="submit"
                        name="decision"
                        value="rejected"
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <X className="h-4 w-4" aria-hidden /> Reject
                      </button>
                    </div>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      )}

      {user.person && (
        <RequestTable
          title="My requests"
          empty={
            <>
              You haven&apos;t made any requests yet.
            </>
          }
          rows={mine}
          showPerson={false}
        />
      )}

      {decidedByMe.length > 0 && (
        <RequestTable title="Recently decided by you" rows={decidedByMe} showPerson empty={null} />
      )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-medium text-slate-900">New request</h2>
            <p className="mb-4 text-xs text-slate-500">
              Ask for parts, equipment, an expense claim, leave or travel. It goes to your manager.
            </p>
            {!user.person ? (
              <p className="text-sm text-slate-500">
                This account isn&apos;t linked to anyone on the org chart, so it can&apos;t make requests.
              </p>
            ) : manager ? (
              <RequestForm
                types={["parts", "equipment", "expense", "leave", "travel"]}
                today={dateKey(new Date())}
                managerName={manager.name}
              />
            ) : (
              <p className="text-sm text-slate-500">
                You&apos;re at the top of the chart, so there is no one to send requests to.
              </p>
            )}
            <p className="mt-4 text-xs text-slate-500">
              Missed clock-ins and overtime are requested from{" "}
              <Link href="/clock" className="font-medium text-blue-600 hover:underline">Clock In/Out</Link>.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function RequestTable({
  title,
  rows,
  showPerson,
  empty,
}: {
  title: string;
  rows: Approval[];
  showPerson: boolean;
  empty: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="font-medium text-slate-900">{title}</h2>
      </div>
      {rows.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-slate-500">{empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                {showPerson && <th scope="col" className="px-5 py-2.5">Person</th>}
                <th scope="col" className="px-5 py-2.5">Type</th>
                <th scope="col" className="px-5 py-2.5">Details</th>
                <th scope="col" className="px-5 py-2.5">Status</th>
                <th scope="col" className="px-5 py-2.5">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((a) => {
                const approver = a.approverId ? getPerson(a.approverId) : undefined;
                return (
                  <tr key={a.id} className="align-top">
                    {showPerson && (
                      <td className="px-5 py-2.5 font-medium text-slate-900">{getPerson(a.personId)?.name}</td>
                    )}
                    <td className="px-5 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${TYPE_STYLE[a.type]}`}>
                        {TYPE_LABEL[a.type]}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-slate-700">
                      {requestSummary(a)}
                      <span className="block text-xs text-slate-500">{a.reason}</span>
                    </td>
                    <td className="px-5 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${STATUS_STYLE[a.status]}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-xs text-slate-500">
                      {a.status === "pending"
                        ? `Waiting for ${approver?.name ?? "a manager"}`
                        : `${a.decidedBy} · ${when(a.decidedAt!)}`}
                      {a.note && <span className="block text-slate-700">&ldquo;{a.note}&rdquo;</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

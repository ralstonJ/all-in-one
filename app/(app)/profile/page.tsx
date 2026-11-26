import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PersonProfile } from "@/components/person-profile";
import { Avatar } from "@/components/avatar";

export const metadata: Metadata = { title: "My Profile" };

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">My Profile</h1>
        <p className="text-sm text-slate-500">Your account and your place on the chart.</p>
      </div>

      <section
        aria-label="Account"
        className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <Avatar
          name={user.displayName}
          size="lg"
          className={user.role === "admin" ? "bg-rose-600 text-white" : "bg-slate-800 text-white"}
        />
        <dl className="grid flex-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Username</dt>
            <dd className="font-mono text-slate-900">{user.username}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Display name</dt>
            <dd className="text-slate-900">{user.displayName}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Role</dt>
            <dd>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium uppercase ${
                  user.role === "admin" ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-700"
                }`}
              >
                {user.role}
              </span>
            </dd>
          </div>
        </dl>
      </section>

      {user.person ? (
        <PersonProfile person={user.person} />
      ) : (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
          This account is not linked to anyone on the org chart. Link it by setting{" "}
          <code className="rounded bg-slate-100 px-1 font-mono text-xs">personId</code> on the
          account in <code className="rounded bg-slate-100 px-1 font-mono text-xs">lib/users.ts</code>.
        </p>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { listPublicAccounts } from "@/lib/users";
import { getAllPeople, getDepartments, getPerson, getTeams } from "@/lib/org";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  await requireAdmin();
  const accounts = listPublicAccounts();
  const people = getAllPeople();
  const roleCounts = new Map<string, number>();
  for (const p of people) roleCounts.set(p.title, (roleCounts.get(p.title) ?? 0) + 1);
  const roles = [...roleCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Admin</h1>
        <p className="text-sm text-slate-500">Accounts and a summary of the org data.</p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-medium text-slate-900">Accounts</h2>
          <p className="text-xs text-slate-500">
            Defined in <code className="font-mono">lib/users.ts</code>. Passwords are stored as bcrypt hashes
            and never shown here.
          </p>
        </div>
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-5 py-3">Username</th>
              <th scope="col" className="px-5 py-3">Display name</th>
              <th scope="col" className="px-5 py-3">Role</th>
              <th scope="col" className="px-5 py-3">Linked person</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {accounts.map((a) => {
              const person = a.personId ? getPerson(a.personId) : undefined;
              return (
                <tr key={a.id}>
                  <td className="px-5 py-3 font-mono text-slate-900">{a.username}</td>
                  <td className="px-5 py-3 text-slate-800">{a.displayName}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium uppercase ${
                        a.role === "admin" ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {a.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-800">
                    {person ? (
                      <Link href={`/people/${person.id}`} className="hover:underline">
                        {person.name} · {person.title}
                      </Link>
                    ) : (
                      <span className="text-slate-400">Not on the chart</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-medium text-slate-900">Org data</h2>
          <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl bg-slate-50 p-3">
              <dt className="text-xs uppercase tracking-wide text-slate-500">People</dt>
              <dd className="text-xl font-semibold">{people.length}</dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <dt className="text-xs uppercase tracking-wide text-slate-500">Departments</dt>
              <dd className="text-xl font-semibold">{getDepartments().length}</dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <dt className="text-xs uppercase tracking-wide text-slate-500">Teams</dt>
              <dd className="text-xl font-semibold">{getTeams().length}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-slate-500">
            Mock data lives in <code className="font-mono">lib/data/people.ts</code>. Direct reports are
            derived from each person&apos;s <code className="font-mono">reportsTo</code>.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-medium text-slate-900">Headcount by role</h2>
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {roles.map(([role, count]) => (
              <li key={role} className="flex items-center justify-between py-1.5">
                <span className="text-slate-700">{role}</span>
                <span className="tabular-nums text-slate-900">{count}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

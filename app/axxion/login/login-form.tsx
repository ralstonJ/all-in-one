"use client";

import { useActionState, useState } from "react";
import { axLogin, type AxLoginState } from "@/app/actions/axxion";

type Group = { role: string; label: string; accounts: { username: string; name: string }[] };

export function AxLoginForm({ next, groups }: { next: string; groups: Group[] }) {
  const [state, action, pending] = useActionState<AxLoginState, FormData>(axLogin, {});
  const [username, setUsername] = useState(state.username ?? "");
  const [password, setPassword] = useState("");
  const use = (u: string) => {
    setUsername(u);
    setPassword("password");
  };
  const input =
    "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

  return (
    <div className="grid gap-4 md:grid-cols-[22rem_1fr]">
      <form action={action} className="rounded-2xl bg-white p-6 shadow-xl">
        <h1 className="text-lg font-semibold text-slate-900">Sign in</h1>
        <input type="hidden" name="next" value={next} />
        <label htmlFor="ax-user" className="mt-4 block text-sm font-medium text-slate-700">Username</label>
        <input id="ax-user" name="username" autoComplete="username" autoCapitalize="none" required value={username} onChange={(e) => setUsername(e.target.value)} className={input} />
        <label htmlFor="ax-pass" className="mt-3 block text-sm font-medium text-slate-700">Password</label>
        <input id="ax-pass" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
        {state.error && (
          <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>
        )}
        <button disabled={pending} className="mt-4 w-full rounded-lg bg-[#0b1f3a] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#11305a] disabled:opacity-60">
          {pending ? "Signing in…" : "Sign in"}
        </button>
        <p className="mt-4 text-xs text-slate-500">
          Demo accounts all use the password <code className="font-mono">password</code>. Pick one on the right.
        </p>
      </form>

      <div className="rounded-2xl bg-white/95 p-5 shadow-xl">
        <h2 className="text-sm font-semibold text-slate-900">Demo accounts</h2>
        <div className="mt-3 space-y-4">
          {groups.map((g) => (
            <div key={g.role}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {g.label} <span className="font-normal normal-case">({g.accounts.length})</span>
              </p>
              <div className="mt-1.5 flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
                {g.accounts.map((a) => (
                  <button
                    key={a.username}
                    type="button"
                    onClick={() => use(a.username)}
                    title={a.name}
                    className={`rounded-md border px-2 py-1 text-xs transition ${
                      username === a.username ? "border-teal-600 bg-teal-50 text-teal-800" : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span className="font-mono">{a.username}</span>
                    {g.role !== "workshop" && <span className="ml-1 text-slate-500">{a.name}</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

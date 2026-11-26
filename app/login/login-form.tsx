"use client";

import { useActionState, useState } from "react";
import { login, type LoginState } from "@/app/actions/auth";

const DEMO_ACCOUNTS = [
  { username: "admin", label: "Administrator", hint: "full access incl. Admin app" },
  { username: "glen", label: "Glen Harper", hint: "Owner, sees attendance" },
  { username: "aisha", label: "Aisha Rahman", hint: "Supervisor, Mechanical & EV" },
  { username: "emily", label: "Emily Chen", hint: "Technician, Service Bays" },
];

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    login,
    {},
  );
  const [username, setUsername] = useState(state.username ?? "");
  const [password, setPassword] = useState("");

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-medium text-slate-900">Sign in</h2>
      <p className="mt-1 text-sm text-slate-500">
        Use one of the demo accounts below.
      </p>

      <form action={formAction} className="mt-5 space-y-4">
        <input type="hidden" name="next" value={next} />
        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-slate-700"
          >
            Username
          </label>
          <input
            id="username"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-700"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>

        {state.error && (
          <p
            role="alert"
            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
          >
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow hover:bg-slate-800 disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="mt-6 border-t border-slate-200 pt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Demo accounts (password: <code className="font-mono">password</code>)
        </p>
        <ul className="mt-2 space-y-2">
          {DEMO_ACCOUNTS.map((acc) => (
            <li key={acc.username}>
              <button
                type="button"
                onClick={() => {
                  setUsername(acc.username);
                  setPassword("password");
                }}
                className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left text-sm hover:border-slate-300 hover:bg-slate-50"
              >
                <span>
                  <span className="font-medium text-slate-900">{acc.label}</span>
                  <span className="ml-2 font-mono text-xs text-slate-500">
                    {acc.username}
                  </span>
                  <span className="block text-xs text-slate-500">{acc.hint}</span>
                </span>
                <span className="text-xs font-medium text-blue-600">Use</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

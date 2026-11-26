"use server";

import { redirect } from "next/navigation";
import { findAccountByUsername, verifyPassword } from "@/lib/users";
import { createSession, destroySession } from "@/lib/session";

export type LoginState = {
  error?: string;
  username?: string;
};

function safeReturnPath(next: string): string {
  // Only allow same-origin relative paths to avoid open redirects.
  if (next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/login")) {
    return next;
  }
  return "/home";
}

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  if (!username || !password) {
    return { error: "Enter your username and password.", username };
  }

  const account = findAccountByUsername(username);
  const ok = account ? await verifyPassword(account, password) : false;
  if (!account || !ok) {
    return { error: "Incorrect username or password.", username };
  }

  await createSession({
    sub: account.id,
    username: account.username,
    role: account.role,
  });
  redirect(safeReturnPath(next));
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

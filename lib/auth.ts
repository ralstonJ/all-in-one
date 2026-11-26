import "server-only";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/session";
import { findAccountById, toPublic, type PublicAccount } from "@/lib/users";
import { getPerson, type Person } from "@/lib/org";

export type CurrentUser = PublicAccount & {
  /** The org-chart person linked to this login, if any. */
  person: Person | null;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await readSession();
  if (!session) return null;
  const account = findAccountById(session.sub);
  if (!account) return null;
  const person = account.personId ? getPerson(account.personId) ?? null : null;
  return { ...toPublic(account), person };
}

/** Use at the top of protected pages. The proxy also guards routes, this is the belt to its braces. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/home");
  return user;
}

/** The owner (and admins) see business-wide dashboards such as attendance. */
export function canSeeBusinessDashboards(user: CurrentUser): boolean {
  return user.role === "admin" || user.person?.title === "Owner";
}

export async function requireBusinessViewer(): Promise<CurrentUser> {
  const user = await requireUser();
  if (!canSeeBusinessDashboards(user)) redirect("/home");
  return user;
}

/** Shape used by the approvals store to check who may decide a request. */
export function toViewer(user: CurrentUser) {
  return {
    isAdmin: user.role === "admin",
    personId: user.person?.id ?? null,
    name: user.displayName,
  };
}

import "server-only";
import bcrypt from "bcryptjs";

export type AccountRole = "admin" | "user";

export type Account = {
  id: string;
  username: string;
  displayName: string;
  role: AccountRole;
  /** Links the login to a person in the org chart, if they are on it. */
  personId: string | null;
  passwordHash: string;
};

export type PublicAccount = Omit<Account, "passwordHash">;

// Demo accounts. All use the password "password" (bcrypt, cost 10).
const DEMO_PASSWORD_HASH =
  "$2b$10$cdj2NlKdnpOUsWf/XFQmnubsRAOK0X6cWQTyoZ04RDRgB8uzPv9GW";

export const accounts: Account[] = [
  {
    id: "acc-admin",
    username: "admin",
    displayName: "Administrator",
    role: "admin",
    personId: null,
    passwordHash: DEMO_PASSWORD_HASH,
  },
  {
    id: "acc-glen",
    username: "glen",
    displayName: "Glen Harper",
    role: "user",
    personId: "glen-harper",
    passwordHash: DEMO_PASSWORD_HASH,
  },
  {
    id: "acc-aisha",
    username: "aisha",
    displayName: "Aisha Rahman",
    role: "user",
    personId: "aisha-rahman",
    passwordHash: DEMO_PASSWORD_HASH,
  },
  {
    id: "acc-emily",
    username: "emily",
    displayName: "Emily Chen",
    role: "user",
    personId: "emily-chen",
    passwordHash: DEMO_PASSWORD_HASH,
  },
];

export function findAccountByUsername(username: string): Account | undefined {
  const needle = username.trim().toLowerCase();
  return accounts.find((a) => a.username === needle);
}

export function findAccountById(id: string): Account | undefined {
  return accounts.find((a) => a.id === id);
}

export async function verifyPassword(account: Account, password: string) {
  return bcrypt.compare(password, account.passwordHash);
}

export function toPublic(account: Account): PublicAccount {
  const { passwordHash: _omit, ...rest } = account;
  void _omit;
  return rest;
}

export function listPublicAccounts(): PublicAccount[] {
  return accounts.map(toPublic);
}

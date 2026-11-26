import type { AxRole } from "@/lib/axxion/token";

/**
 * Axxion demo accounts. Generated, not stored; every account uses the
 * password "password". Counts are constants so the demo can be scaled up
 * (e.g. 70+ surveyors, 1,000+ workshops) without other changes.
 */

export const COUNTS = { handler: 3, surveyor: 10, head: 2, workshop: 20 } as const;

export const EMIRATES = ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah"] as const;
export type Emirate = (typeof EMIRATES)[number];

export type AxAccount = {
  id: string; // same as username
  username: string;
  name: string;
  role: AxRole;
  emirate?: Emirate;
};

export const ROLE_LABEL: Record<AxRole, string> = {
  handler: "Claim Handler",
  surveyor: "Surveyor",
  head: "Head of Claims",
  workshop: "Workshop",
  admin: "Admin",
};

/** bcrypt hash of "password" (same demo hash as the workshop app). */
export const AX_PASSWORD_HASH = "$2b$10$cdj2NlKdnpOUsWf/XFQmnubsRAOK0X6cWQTyoZ04RDRgB8uzPv9GW";

const HANDLERS = ["Fatima Al Zaabi", "Rohan Mehta", "Sarah O'Connor", "Omar Al Hashmi", "Grace Liu"];
const HEADS = ["Khalid Al Suwaidi", "Natalia Petrova", "David Mensah"];
const SURVEYOR_FIRST = ["Ahmed", "Priya", "Joseph", "Hassan", "Ana", "Imran", "Leila", "Vikram", "Tomás", "Noura", "Bilal", "Mariam"];
const SURVEYOR_LAST = ["Saleh", "Raman", "Mathew", "Darwish", "Souza", "Qureshi", "Haddad", "Iyer", "García", "Al Ketbi", "Shaikh", "Fernandes"];
const WORKSHOP_A = ["Al Quoz", "Desert", "Gulf", "Falcon", "Marina", "Oasis", "Pearl", "Emirates", "Crescent", "Palm", "Sahara", "Dune"];
const WORKSHOP_B = ["Auto Body", "Motors", "Collision Centre", "Car Care", "Garage", "Auto Works", "Body & Paint"];

const pad = (n: number, w: number) => String(n).padStart(w, "0");
const width = (n: number) => Math.max(2, String(n).length);

function build(): AxAccount[] {
  const out: AxAccount[] = [{ id: "admin", username: "admin", name: "Axxion Admin", role: "admin" }];
  const add = (role: AxRole, count: number, name: (i: number) => string, emirate?: (i: number) => Emirate) => {
    for (let i = 0; i < count; i++) {
      const username = `${role === "handler" ? "handler" : role}${pad(i + 1, width(count))}`;
      out.push({ id: username, username, name: name(i), role, emirate: emirate?.(i) });
    }
  };
  add("handler", COUNTS.handler, (i) => HANDLERS[i % HANDLERS.length] + (i >= HANDLERS.length ? ` ${Math.floor(i / HANDLERS.length) + 1}` : ""));
  add("head", COUNTS.head, (i) => HEADS[i % HEADS.length] + (i >= HEADS.length ? ` ${Math.floor(i / HEADS.length) + 1}` : ""));
  add(
    "surveyor",
    COUNTS.surveyor,
    (i) => `${SURVEYOR_FIRST[i % SURVEYOR_FIRST.length]} ${SURVEYOR_LAST[(i * 5) % SURVEYOR_LAST.length]}`,
    (i) => EMIRATES[i % EMIRATES.length],
  );
  add(
    "workshop",
    COUNTS.workshop,
    (i) =>
      `${WORKSHOP_A[i % WORKSHOP_A.length]} ${WORKSHOP_B[(i * 3) % WORKSHOP_B.length]}` +
      (i >= WORKSHOP_A.length ? ` ${Math.floor(i / WORKSHOP_A.length) + 1}` : ""),
    (i) => EMIRATES[i % EMIRATES.length],
  );
  return out;
}

export const AX_ACCOUNTS: AxAccount[] = build();
const BY_ID = new Map(AX_ACCOUNTS.map((a) => [a.id, a]));

export function getAxAccount(id: string | null | undefined): AxAccount | undefined {
  return id ? BY_ID.get(id) : undefined;
}

export function accountsByRole(role: AxRole): AxAccount[] {
  return AX_ACCOUNTS.filter((a) => a.role === role);
}

export function findAxAccountByUsername(username: string): AxAccount | undefined {
  return BY_ID.get(username.trim().toLowerCase());
}

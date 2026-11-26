import "server-only";
import { readJson, writeJson } from "@/lib/data-store";
import { randomUUID } from "node:crypto";
import type { CurrentUser } from "@/lib/auth";
import { getAllReports, getDepartments, getPerson } from "@/lib/org";

/**
 * Standard operating procedures, stored in sops.json in the data folder (see lib/data-store.ts).
 *
 * Access model
 * - Every SOP belongs to one or more departments.
 * - You can read an SOP if it belongs to a department you work in or lead.
 *   "Lead" means someone in that department reports to you, directly or not.
 * - A leader of several departments can write one SOP shared between them.
 * - The owner and admins can read everything.
 * - Anyone can publish to their own department; leaders also to the departments they lead.
 * - You can edit an SOP you wrote, or one where you lead every department it belongs to.
 */

export type Sop = {
  id: string;
  title: string;
  summary: string;
  body: string; // Markdown
  departments: string[];
  authorId: string | null;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  version: number;
};


/* ─── Access ────────────────────────────────────────────────────────────── */

function seesEverything(user: CurrentUser) {
  return user.role === "admin" || user.person?.title === "Owner";
}

/** Departments a person works in or leads (anyone below them in the chart). */
export function departmentsFor(user: CurrentUser): string[] {
  if (seesEverything(user)) return getDepartments();
  if (!user.person) return [];
  const set = new Set([user.person.department]);
  for (const p of getAllReports(user.person.id)) set.add(p.department);
  return [...set];
}

export function canRead(user: CurrentUser, sop: Sop): boolean {
  if (seesEverything(user)) return true;
  if (user.person && sop.authorId === user.person.id) return true;
  const mine = new Set(departmentsFor(user));
  return sop.departments.some((d) => mine.has(d));
}

/** Departments someone leads: those of the people below them in the chart. */
export function ledDepartments(user: CurrentUser): string[] {
  if (seesEverything(user)) return getDepartments();
  if (!user.person) return [];
  return [...new Set(getAllReports(user.person.id).map((p) => p.department))];
}

export function canEdit(user: CurrentUser, sop: Sop): boolean {
  if (seesEverything(user)) return true;
  if (user.person && sop.authorId === user.person.id) return true;
  const led = new Set(ledDepartments(user));
  return sop.departments.every((d) => led.has(d));
}

/** Departments this user may publish to. */
export function publishableDepartments(user: CurrentUser): string[] {
  return departmentsFor(user);
}

/* ─── Persistence ───────────────────────────────────────────────────────── */

function seed(): Sop[] {
  const at = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString();
  const make = (
    title: string,
    summary: string,
    departments: string[],
    authorId: string,
    daysAgo: number,
    body: string,
    version = 1,
  ): Sop => {
    const author = getPerson(authorId);
    return {
      id: randomUUID(),
      title,
      summary,
      body: body.trim(),
      departments,
      authorId,
      authorName: author?.name ?? "Unknown",
      createdAt: at(daysAgo + 40),
      updatedAt: at(daysAgo),
      updatedBy: author?.name ?? "Unknown",
      version,
    };
  };

  return [
    make(
      "Paint booth start-up and shutdown",
      "Daily checks before spraying and the end-of-day shutdown sequence.",
      ["Body Shop"],
      "tom-whitaker",
      6,
      `
## Before the first job
1. Check the booth pressure gauge reads **positive** with doors closed.
2. Inspect intake and exhaust filters; replace if the manometer is over the red mark.
3. Confirm the air-fed respirator supply is on and the line filter is dry.
4. Wipe down the floor grates and tack-rag the booth walls.

## Bake cycle
- Default bake: **60 °C for 30 minutes** unless the paint data sheet says otherwise.
- Never leave the booth in bake with a person inside.

## Shutdown
1. Run a 10-minute purge with the booth empty.
2. Switch burners off, then fans.
3. Log hours and filter readings in the booth book.
`,
      3,
    ),
    make(
      "Panel gap and alignment check",
      "How to measure and sign off panel gaps after structural or bolt-on repairs.",
      ["Body Shop"],
      "tom-whitaker",
      15,
      `
## Tools
Feeler gauges, gap gauge, manufacturer body dimension sheet.

## Steps
1. Measure gaps at **three points** per seam (top, middle, bottom).
2. Compare against the manufacturer tolerance; flag anything over ±0.5 mm.
3. Check flush with a straight edge across each panel joint.
4. Record readings on the job card before the car goes to paint.

> If a door gap is out after hanging, re-check the hinge pillar before adjusting the striker.
`,
    ),
    make(
      "Vehicle intake and pre-service inspection",
      "What every technician checks and records before starting work on a car.",
      ["Mechanical"],
      "aisha-rahman",
      4,
      `
## On arrival in the bay
1. Fit seat, steering-wheel and floor covers.
2. Photograph the odometer and fuel gauge.
3. Walk around the car and note existing damage on the job card.

## Pre-service checks
- [ ] Warning lights on the dash
- [ ] Tyre tread depth and pressures
- [ ] Brake pad thickness (front and rear)
- [ ] Fluid levels and leaks
- [ ] Battery health test

Anything outside the job scope goes to the service advisor **before** you start extra work.
`,
      2,
    ),
    make(
      "HV battery isolation and lock-out",
      "Isolating an EV or hybrid high-voltage system before any HV work.",
      ["EV & High Voltage"],
      "omar-haddad",
      9,
      `
## Only qualified HV staff
This procedure is for trained EV high-voltage electricians only.

## Isolation
1. Wear class 0 insulated gloves (check the test date) and face shield.
2. Ignition off, key fob **3 m away** from the vehicle.
3. Disconnect the 12 V battery negative.
4. Remove the HV service disconnect and keep it in your pocket.
5. Apply your personal lock and **DANGER: HV ISOLATED** tag.
6. Wait the manufacturer discharge time (usually 5–10 minutes).
7. Verify zero volts at the inverter with a CAT III meter — test the meter before and after.

## Restoring
Reverse the steps. Only the person whose lock is on the vehicle may remove it.
`,
    ),
    make(
      "Hybrid and EV servicing: safety for mechanical staff",
      "Shared rules for technicians and HV electricians working on the same electrified car.",
      ["Mechanical", "EV & High Voltage"],
      "aisha-rahman",
      2,
      `
## Who does what
- **Technicians** may do routine servicing (fluids, brakes, tyres, filters) on hybrids and EVs.
- **Orange cables, inverters and battery packs** are HV staff only.

## Before starting
1. Check the job card for an **HV** flag.
2. If the job touches anything near orange cabling, ask the HV bay to isolate the car first.
3. Never cut, pierce or clamp orange cables.

## Handover between teams
The HV electrician signs the job card when the car is isolated, and again when it is restored.
`,
    ),
    make(
      "Collision repairs on electric vehicles",
      "De-energising and handling EVs that arrive with crash damage.",
      ["Body Shop", "EV & High Voltage"],
      "marcus-bell",
      11,
      `
## On arrival
1. Park the vehicle in the **EV quarantine bay**, at least 15 m from other cars.
2. HV bay checks battery temperature with the thermal camera.
3. If the pack is damaged or hot, call the fire service and keep everyone clear.

## Before panel work
- HV bay isolates the vehicle (see *HV battery isolation and lock-out*).
- No welding or cutting within **30 cm** of HV components or the battery tray.
- Remove the 12 V battery before any spot welding.

## Painting
Bake temperature for EVs is capped at **50 °C** to protect the battery pack.
`,
    ),
    make(
      "Customer check-in and key tags",
      "Front desk process from arrival to the car reaching the workshop.",
      ["Front of House"],
      "marcus-bell",
      20,
      `
1. Greet the customer and confirm the booking in the system.
2. Confirm contact number and preferred update method (call or WhatsApp).
3. Attach a numbered key tag and record it on the job card.
4. Note any valuables left in the car and ask the customer to remove them.
5. Give an estimated ready time and hand the keys to the workshop board.
`,
    ),
    make(
      "Insurer invoicing and remittance matching",
      "Month-end steps for billing insurers and matching their payments.",
      ["Finance"],
      "daniel-okafor",
      8,
      `
## Weekly
- Raise invoices for all jobs marked **Ready for billing**.
- Attach the approved estimate and supplementary authorisations.

## Month end
1. Match remittances to invoices by claim number.
2. Chase anything over **30 days** with the insurer's claims desk.
3. Send the aged debtors report to the General Manager.
`,
    ),
    make(
      "Insurance quote approval",
      "How estimates are prepared, checked and sent to insurers.",
      ["Estimating"],
      "sofia-romano",
      13,
      `
1. Photograph all damage, including VIN plate and odometer.
2. Build the estimate in the estimating system using OEM part numbers.
3. Estimates over **AED 15,000** need the Estimator Lead's check before sending.
4. Upload to the insurer portal and record the claim number on the job card.
`,
    ),
  ];
}

function load(): Sop[] {
  const stored = readJson<Sop[]>("sops.json");
  if (stored) return stored;
  const fresh = seed();
  save(fresh);
  return fresh;
}

function save(sops: Sop[]) {
  writeJson("sops.json", sops, true);
}

/* ─── Queries & mutations ───────────────────────────────────────────────── */

export function listSopsFor(user: CurrentUser): Sop[] {
  return load()
    .filter((s) => canRead(user, s))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function getSop(id: string): Sop | undefined {
  return load().find((s) => s.id === id);
}

export function upsertSop(
  user: CurrentUser,
  input: { id?: string; title: string; summary: string; body: string; departments: string[] },
): { sop?: Sop; error?: string } {
  const allowed = new Set(publishableDepartments(user));
  if (!input.departments.length) return { error: "Pick at least one department." };
  const sops = load();
  const now = new Date().toISOString();

  if (input.id) {
    const existing = sops.find((s) => s.id === input.id);
    if (!existing) return { error: "That SOP no longer exists." };
    if (!canEdit(user, existing)) return { error: "You can't edit this SOP." };
    // Keep departments the editor can't publish to (e.g. an author who moved teams).
    const kept = existing.departments.filter((d) => !allowed.has(d));
    const chosen = input.departments.filter((d) => allowed.has(d));
    Object.assign(existing, {
      title: input.title,
      summary: input.summary,
      body: input.body,
      departments: [...new Set([...kept, ...chosen])],
      updatedAt: now,
      updatedBy: user.displayName,
      version: existing.version + 1,
    });
    save(sops);
    return { sop: existing };
  }

  if (input.departments.some((d) => !allowed.has(d)))
    return { error: "You can only publish to departments you work in or lead." };
  const sop: Sop = {
    title: input.title,
    summary: input.summary,
    body: input.body,
    departments: input.departments,
    id: randomUUID(),
    authorId: user.person?.id ?? null,
    authorName: user.displayName,
    createdAt: now,
    updatedAt: now,
    updatedBy: user.displayName,
    version: 1,
  };
  sops.push(sop);
  save(sops);
  return { sop };
}

export function deleteSop(user: CurrentUser, id: string): { error?: string } {
  const sops = load();
  const sop = sops.find((s) => s.id === id);
  if (!sop) return { error: "That SOP no longer exists." };
  if (!canEdit(user, sop)) return { error: "You can't delete this SOP." };
  save(sops.filter((s) => s.id !== id));
  return {};
}

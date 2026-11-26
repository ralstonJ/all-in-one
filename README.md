# All-in-One

Internal web app for a workshop / garage, built with Next.js 16 (App Router), TypeScript and Tailwind CSS.
Apps are reached from a Google-style 9-dot launcher in the header; the first app is an interactive org chart.

## Run it

```bash
npm install
npm run dev
```

The dev server picks a free port (`next dev --port 0`). Read the URL from the terminal, e.g.
`- Local: http://localhost:58412`, and open it.

## Demo accounts

| Username | Password   | Role  | On the org chart as |
| -------- | ---------- | ----- | ------------------- |
| `admin`  | `password` | admin | not linked          |
| `glen`   | `password` | user  | Glen Harper, Owner  |
| `aisha`  | `password` | user  | Aisha Rahman, Supervisor |
| `emily`  | `password` | user  | Emily Chen, Technician |

The admin role additionally sees the **Admin** app. The Owner and admin also see **Attendance**.

## Apps in the launcher

- **Home** – overview, headcount, your position in the chart
- **Org Chart** – collapsible hierarchy list with search; the side panel shows the selected person's
  details, their reporting line up to the top of the chart, and their direct reports.
  Deep link: `/org-chart?focus=<person-id>`
- **Directory** – searchable table with department filter
- **Departments** – people grouped by department and team
- **My Profile** – your account and, if linked, your person profile
- **Clock In/Out** (everyone) – clock in and out, today's sessions, this week's hours, and requests
  to your manager: missed clock-in/out, overtime, leave
- **Calendar** (everyone) – your upcoming tasks in month, week or day view (FullCalendar); click a
  task for vehicle, customer and job card. Emily Chen has a full schedule of workshop jobs.
  Once a job has started it can be marked complete with a comment and up to 6 photos (resized in the
  browser, stored in `.data/uploads`, served only to the worker, their managers, the owner and admins).
- **SOPs** (everyone) – standard operating procedures in Markdown. Each SOP belongs to one or more
  departments; you see SOPs for departments you work in or lead (anyone in it reports to you), and a
  leader of several departments can publish one shared SOP. Owner and admin see all. Stored in
  `.data/sops.json`.
- **Approvals** (everyone) – request parts, equipment, expenses, leave or travel; managers approve or
  reject their direct reports' requests (including missed clocks and overtime); everyone sees
  their own requests and decisions. The launcher tile shows a badge with the pending count.
  Approving a missed-clock request adds the missing clock events.
- **Attendance**, **Labour Usage**, **Parts Used** (owner and admin) – dashboards linked from Home
- **Admin** (admin only)

Clock events and requests are saved to `.data/store.json` (gitignored) and seeded on first run.
Delete that file to reset the demo data.

## Where things live

| Path                     | What                                                                 |
| ------------------------ | -------------------------------------------------------------------- |
| `lib/data/people.ts`     | Mock org data: name, title, department, optional team, `reportsTo`   |
| `lib/org.ts`             | Helpers: manager, direct reports, chain of command, department colours |
| `lib/users.ts`           | Login accounts (bcrypt hashes) and the link to a person              |
| `lib/apps.ts`            | Apps shown in the 9-dot launcher                                     |
| `lib/session-token.ts`   | Signed JWT session (jose); also used by `proxy.ts`                   |
| `proxy.ts`               | Route guard: everything except `/login` needs a session              |
| `app/actions/auth.ts`    | `login` / `logout` server actions                                    |
| `components/org-chart.tsx` | The interactive org chart                                          |

Direct reports are derived from each person's `reportsTo`, so the hierarchy is declared once.

## Configuration

Copy `.env.example` to `.env.local` and set `SESSION_SECRET` to a long random string
(`openssl rand -hex 32`). A `.env.local` was generated when the project was created.

## Adding people or accounts

- Add a person to `lib/data/people.ts` with a unique `id` and the `id` of their manager in `reportsTo`.
- Add an account to `lib/users.ts`; generate a hash with
  `node -e 'console.log(require("bcryptjs").hashSync("your-password", 10))'`.

---

# Axxion claims portal (`/axxion`)

A separate app for Axxion's motor claims team, at `/axxion/login` and `/axxion/home`. It has its own login,
session cookie (`axx_session`) and data; a workshop-app session can't open it and vice versa.

## Demo accounts (password `password` for all)

| Role | Usernames |
| --- | --- |
| Claim Handler | `handler01` – `handler03` |
| Surveyor | `surveyor01` – `surveyor10` |
| Head of Claims | `head01` – `head02` |
| Workshop | `workshop01` – `workshop20` (4 per emirate) |
| Admin | `admin` |

Counts live in `lib/axxion/accounts.ts` (`COUNTS`) and can be raised (e.g. 75 surveyors, 1,000 workshops).

## Claim flow (modelled on ClaimOS)

Every open step runs one SLA clock from the catalogue (`lib/axxion/sla-catalogue.ts`). Clocks count
working time only: Monday to Saturday, 09:00–18:00 Dubai.

Initial survey (surveyor, 60 min) → repair location (handler, 6 h) → quotes from invited garages
(3 windows of 4 h = 12 h) → survey & negotiation (surveyor, 24 h) → survey sign-off (HoC, 24 h) →
[fraud review (HoC, 24 h)] → garage award (HoC, 24 h) → LPO from the insurer (72 h; the handler records
it) → drop-off (handler, 48 h) → car received, repair dates, parts list (garage) → repair by the expected
date → schedule QC (handler, 48 h) → QC (surveyor, 48 h) → QC verified (HoC, 24 h) → notify pickup
(handler, 24 h) → pickup (garage, pickup window) → final invoice (garage, 72 h) → [flagged invoice
(handler, 48 h)] → closed.

Side steps: surveyor not assigned (handler, 30 min), replacement garage when the top-up finds none
(handler, 60 min), rework after a failed QC (garage, 48 h), QC corrections when sent back (surveyor, 24 h).
24 of the 25 clocks are used; "total-loss decision not received" never fires (as in ClaimOS).

## Who sees what on `/axxion/home`

- **Claims handler / Surveyor:** steps that are breached, due by the end of the working day, or new today.
- **Head of Claims:** survey sign-offs, garage awards, QC verifications and fraud reviews, actioned inline.
- **Workshop (garage):** quote requests with the working-time deadline, awarded jobs where it's their turn,
  and past quotes.
- **Admin:** Overview, Blockers (breached SLAs by owner and by clock), Team, Pipeline.

**Reminders and escalation are automatic**, as in ClaimOS: reminders fire at the catalogue's reminder
points, and a breach records the breach and escalates to the clock's group (CLAIMS / SURVEY / INSURER /
WORKSHOP ESCALATION). **Blockers** are breached clocks. A manual **Send reminder** (and "Remind all" per
group) only logs a note on the claim; it doesn't escalate or count.

Data is generated on first use into `.data/axxion.json` (gitignored). Delete it to reset the demo.

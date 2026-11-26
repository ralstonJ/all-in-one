/**
 * Mock org data for Westside Collision & Mechanical, a combined panel/paint
 * body shop and mechanical workshop with an EV high-voltage bay.
 *
 * Every person has a name, title, department, optional team, and the id of
 * the person they report to (null for the owner). Direct reports are derived
 * from `reportsTo`, so the hierarchy only has to be declared once.
 */

export type Role =
  | "Owner"
  | "General Manager"
  | "Operations Manager"
  | "Estimator Lead"
  | "Finance Manager"
  | "Supervisor"
  | "Reception Staff"
  | "Technician"
  | "Painter"
  | "Denter"
  | "Electrician"
  | "EV High-Voltage (HV) Electrician"
  | "Estimator"
  | "Support Staff";

export type Person = {
  id: string;
  name: string;
  title: Role;
  department: string;
  /** Optional: a smaller unit inside the department (bay, desk, crew). */
  team?: string;
  /** What this person mostly looks after; shown as a subtitle. */
  focus?: string;
  /** id of the manager, or null for the top of the chart. */
  reportsTo: string | null;
  email: string;
  extension: string;
  location: string;
  startDate: string; // ISO date
};

export const COMPANY = {
  name: "Westside Collision & Mechanical",
  shortName: "Westside Auto",
  domain: "westsideauto.example",
};

const e = (local: string) => `${local}@${COMPANY.domain}`;

export const people: Person[] = [
  // ─── Executive & management ────────────────────────────────────────────
  {
    id: "glen-harper",
    name: "Glen Harper",
    title: "Owner",
    department: "Executive",
    focus: "Owns the business; sets direction and major investments",
    reportsTo: null,
    email: e("glen.harper"),
    extension: "100",
    location: "Main office",
    startDate: "2009-03-02",
  },
  {
    id: "priya-nair",
    name: "Priya Nair",
    title: "General Manager",
    department: "Management",
    focus: "Day-to-day running of the whole site",
    reportsTo: "glen-harper",
    email: e("priya.nair"),
    extension: "101",
    location: "Main office",
    startDate: "2014-07-14",
  },
  {
    id: "marcus-bell",
    name: "Marcus Bell",
    title: "Operations Manager",
    department: "Operations",
    focus: "Workshop flow, scheduling, parts and front of house",
    reportsTo: "priya-nair",
    email: e("marcus.bell"),
    extension: "110",
    location: "Workshop office",
    startDate: "2016-02-01",
  },
  {
    id: "sofia-romano",
    name: "Sofia Romano",
    title: "Estimator Lead",
    department: "Estimating",
    team: "Quoting",
    focus: "Insurance and private quotes, repair authorisations",
    reportsTo: "priya-nair",
    email: e("sofia.romano"),
    extension: "120",
    location: "Estimating bay",
    startDate: "2017-09-18",
  },
  {
    id: "daniel-okafor",
    name: "Daniel Okafor",
    title: "Finance Manager",
    department: "Finance",
    focus: "Accounts, payroll, insurer billing and reporting",
    reportsTo: "priya-nair",
    email: e("daniel.okafor"),
    extension: "130",
    location: "Main office",
    startDate: "2018-01-08",
  },

  // ─── Supervisors ───────────────────────────────────────────────────────
  {
    id: "tom-whitaker",
    name: "Tom Whitaker",
    title: "Supervisor",
    department: "Body Shop",
    team: "Panel & Paint",
    focus: "Runs the panel bay and paint booth crews",
    reportsTo: "marcus-bell",
    email: e("tom.whitaker"),
    extension: "210",
    location: "Body shop",
    startDate: "2012-05-21",
  },
  {
    id: "aisha-rahman",
    name: "Aisha Rahman",
    title: "Supervisor",
    department: "Mechanical",
    team: "Mechanical & EV",
    focus: "Runs the service bays, auto electrical and HV bay",
    reportsTo: "marcus-bell",
    email: e("aisha.rahman"),
    extension: "310",
    location: "Mechanical workshop",
    startDate: "2015-11-09",
  },

  // ─── Front of house ────────────────────────────────────────────────────
  {
    id: "chloe-bennett",
    name: "Chloe Bennett",
    title: "Reception Staff",
    department: "Front of House",
    team: "Front Desk",
    focus: "Customer check-in, bookings and courtesy cars",
    reportsTo: "marcus-bell",
    email: e("chloe.bennett"),
    extension: "200",
    location: "Reception",
    startDate: "2021-03-15",
  },
  {
    id: "liam-foster",
    name: "Liam Foster",
    title: "Reception Staff",
    department: "Front of House",
    team: "Front Desk",
    focus: "Phones, invoicing hand-off and vehicle collection",
    reportsTo: "marcus-bell",
    email: e("liam.foster"),
    extension: "201",
    location: "Reception",
    startDate: "2023-06-05",
  },

  // ─── Mechanical: technicians ───────────────────────────────────────────
  {
    id: "jake-morrison",
    name: "Jake Morrison",
    title: "Technician",
    department: "Mechanical",
    team: "Service Bays",
    focus: "Diagnostics and drivability",
    reportsTo: "aisha-rahman",
    email: e("jake.morrison"),
    extension: "311",
    location: "Bay 1",
    startDate: "2016-08-22",
  },
  {
    id: "ravi-patel",
    name: "Ravi Patel",
    title: "Technician",
    department: "Mechanical",
    team: "Service Bays",
    focus: "Suspension, steering and wheel alignment",
    reportsTo: "aisha-rahman",
    email: e("ravi.patel"),
    extension: "312",
    location: "Bay 2",
    startDate: "2019-04-01",
  },
  {
    id: "emily-chen",
    name: "Emily Chen",
    title: "Technician",
    department: "Mechanical",
    team: "Service Bays",
    focus: "Servicing, brakes and roadworthy inspections",
    reportsTo: "aisha-rahman",
    email: e("emily.chen"),
    extension: "313",
    location: "Bay 3",
    startDate: "2020-10-12",
  },
  {
    id: "noah-kaur",
    name: "Noah Kaur",
    title: "Technician",
    department: "Mechanical",
    team: "Service Bays",
    focus: "Apprentice (3rd year)",
    reportsTo: "aisha-rahman",
    email: e("noah.kaur"),
    extension: "314",
    location: "Bay 3",
    startDate: "2024-02-05",
  },

  // ─── Mechanical: auto electrical ───────────────────────────────────────
  {
    id: "ben-carter",
    name: "Ben Carter",
    title: "Electrician",
    department: "Mechanical",
    team: "Auto Electrical",
    focus: "12V systems, wiring repairs and ADAS calibration",
    reportsTo: "aisha-rahman",
    email: e("ben.carter"),
    extension: "320",
    location: "Bay 4",
    startDate: "2017-01-30",
  },
  {
    id: "hannah-lee",
    name: "Hannah Lee",
    title: "Electrician",
    department: "Mechanical",
    team: "Auto Electrical",
    focus: "Air conditioning, lighting and accessories",
    reportsTo: "aisha-rahman",
    email: e("hannah.lee"),
    extension: "321",
    location: "Bay 4",
    startDate: "2022-07-18",
  },

  // ─── EV high voltage ───────────────────────────────────────────────────
  {
    id: "omar-haddad",
    name: "Omar Haddad",
    title: "EV High-Voltage (HV) Electrician",
    department: "EV & High Voltage",
    team: "HV Bay",
    focus: "Battery pack isolation, HV diagnostics and repairs",
    reportsTo: "aisha-rahman",
    email: e("omar.haddad"),
    extension: "330",
    location: "HV bay",
    startDate: "2021-09-06",
  },
  {
    id: "zoe-mitchell",
    name: "Zoe Mitchell",
    title: "EV High-Voltage (HV) Electrician",
    department: "EV & High Voltage",
    team: "HV Bay",
    focus: "Hybrid systems, charging faults and de-energising for body repairs",
    reportsTo: "aisha-rahman",
    email: e("zoe.mitchell"),
    extension: "331",
    location: "HV bay",
    startDate: "2023-01-16",
  },

  // ─── Body shop: painters ───────────────────────────────────────────────
  {
    id: "luca-ferrari",
    name: "Luca Ferrari",
    title: "Painter",
    department: "Body Shop",
    team: "Paint Booth",
    focus: "Colour matching and refinishing",
    reportsTo: "tom-whitaker",
    email: e("luca.ferrari"),
    extension: "220",
    location: "Paint booth 1",
    startDate: "2013-06-10",
  },
  {
    id: "grace-oneill",
    name: "Grace O'Neill",
    title: "Painter",
    department: "Body Shop",
    team: "Paint Booth",
    focus: "Prep, priming and masking",
    reportsTo: "tom-whitaker",
    email: e("grace.oneill"),
    extension: "221",
    location: "Paint booth 2",
    startDate: "2019-11-04",
  },
  {
    id: "kai-tanaka",
    name: "Kai Tanaka",
    title: "Painter",
    department: "Body Shop",
    team: "Paint Booth",
    focus: "Clear coat, polishing and detailing hand-over",
    reportsTo: "tom-whitaker",
    email: e("kai.tanaka"),
    extension: "222",
    location: "Paint booth 2",
    startDate: "2022-03-28",
  },

  // ─── Body shop: denters ────────────────────────────────────────────────
  {
    id: "sam-dawson",
    name: "Sam Dawson",
    title: "Denter",
    department: "Body Shop",
    team: "Panel Bay",
    focus: "Structural and chassis repairs",
    reportsTo: "tom-whitaker",
    email: e("sam.dawson"),
    extension: "230",
    location: "Panel bay 1",
    startDate: "2014-09-15",
  },
  {
    id: "isla-murphy",
    name: "Isla Murphy",
    title: "Denter",
    department: "Body Shop",
    team: "Panel Bay",
    focus: "Paintless dent removal and panel replacement",
    reportsTo: "tom-whitaker",
    email: e("isla.murphy"),
    extension: "231",
    location: "Panel bay 2",
    startDate: "2020-02-03",
  },
  {
    id: "mateo-alvarez",
    name: "Mateo Alvarez",
    title: "Denter",
    department: "Body Shop",
    team: "Panel Bay",
    focus: "Aluminium and composite panel work",
    reportsTo: "tom-whitaker",
    email: e("mateo.alvarez"),
    extension: "232",
    location: "Panel bay 3",
    startDate: "2023-08-21",
  },

  // ─── Estimating ────────────────────────────────────────────────────────
  {
    id: "ethan-walsh",
    name: "Ethan Walsh",
    title: "Estimator",
    department: "Estimating",
    team: "Quoting",
    focus: "Insurance assessments and supplementary claims",
    reportsTo: "sofia-romano",
    email: e("ethan.walsh"),
    extension: "121",
    location: "Estimating bay",
    startDate: "2019-06-17",
  },
  {
    id: "maya-singh",
    name: "Maya Singh",
    title: "Estimator",
    department: "Estimating",
    team: "Quoting",
    focus: "Private and fleet quotes, parts pricing",
    reportsTo: "sofia-romano",
    email: e("maya.singh"),
    extension: "122",
    location: "Estimating bay",
    startDate: "2022-10-10",
  },

  // ─── Finance support ───────────────────────────────────────────────────
  {
    id: "rachel-green",
    name: "Rachel Green",
    title: "Support Staff",
    department: "Finance",
    team: "Accounts",
    focus: "Accounts receivable and insurer remittances",
    reportsTo: "daniel-okafor",
    email: e("rachel.green"),
    extension: "131",
    location: "Main office",
    startDate: "2018-05-14",
  },
  {
    id: "oliver-brooks",
    name: "Oliver Brooks",
    title: "Support Staff",
    department: "Finance",
    team: "Accounts",
    focus: "Payroll, accounts payable and supplier statements",
    reportsTo: "daniel-okafor",
    email: e("oliver.brooks"),
    extension: "132",
    location: "Main office",
    startDate: "2021-11-01",
  },

  // ─── Operations support ────────────────────────────────────────────────
  {
    id: "dev-sharma",
    name: "Dev Sharma",
    title: "Support Staff",
    department: "Operations",
    team: "Parts & Detailing",
    focus: "Parts coordinator: ordering, receiving and returns",
    reportsTo: "marcus-bell",
    email: e("dev.sharma"),
    extension: "240",
    location: "Parts store",
    startDate: "2017-04-03",
  },
  {
    id: "freya-lund",
    name: "Freya Lund",
    title: "Support Staff",
    department: "Operations",
    team: "Parts & Detailing",
    focus: "Detailer: pre-delivery wash and interior clean",
    reportsTo: "marcus-bell",
    email: e("freya.lund"),
    extension: "241",
    location: "Detailing bay",
    startDate: "2022-01-24",
  },
  {
    id: "carlos-mendes",
    name: "Carlos Mendes",
    title: "Support Staff",
    department: "Operations",
    team: "Parts & Detailing",
    focus: "Workshop assistant: vehicle movements, consumables, housekeeping",
    reportsTo: "marcus-bell",
    email: e("carlos.mendes"),
    extension: "242",
    location: "Workshop floor",
    startDate: "2024-05-13",
  },
];

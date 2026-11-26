/**
 * Apps shown in the 9-dot launcher. The org chart is one of several pages
 * reachable from it. Icons are referenced by key so this file stays usable on
 * the server; the launcher maps keys to lucide icons on the client.
 */
export type AppIconKey =
  | "home"
  | "org-chart"
  | "directory"
  | "departments"
  | "profile"
  | "admin"
  | "attendance"
  | "labour"
  | "parts-usage"
  | "clock"
  | "approvals"
  | "calendar"
  | "docs"
  | "jobs"
  | "bookings"
  | "parts";

export type AppDef = {
  id: string;
  name: string;
  description: string;
  href: string;
  icon: AppIconKey;
  /** Tailwind classes for the tile background + icon colour. */
  tile: string;
  adminOnly?: boolean;
  /** Count shown as a badge on the launcher tile (e.g. pending approvals). */
  badge?: number;
  /** Visible to the owner and admins. */
  ownerOnly?: boolean;
  /** Keep the page (and its header label) but don't show a launcher tile. */
  hideFromLauncher?: boolean;
  comingSoon?: boolean;
};

export const apps: AppDef[] = [
  {
    id: "home",
    name: "Home",
    description: "Overview of the workshop and quick links",
    href: "/home",
    icon: "home",
    tile: "bg-blue-50 text-blue-600",
  },
  {
    id: "clock",
    name: "Clock In/Out",
    description: "Clock in and out, see your hours, make requests",
    href: "/clock",
    icon: "clock",
    tile: "bg-emerald-50 text-emerald-600",
  },
  {
    id: "approvals",
    name: "Approvals",
    description: "Leave, overtime and missed-clock requests",
    href: "/approvals",
    icon: "approvals",
    tile: "bg-fuchsia-50 text-fuchsia-600",
  },
  {
    id: "calendar",
    name: "Calendar",
    description: "Your upcoming tasks by month, week or day",
    href: "/calendar",
    icon: "calendar",
    tile: "bg-sky-50 text-sky-600",
  },
  {
    id: "docs",
    name: "SOPs",
    description: "Standard operating procedures for your departments",
    href: "/docs",
    icon: "docs",
    tile: "bg-amber-50 text-amber-600",
  },
  {
    id: "org-chart",
    name: "Org Chart",
    description: "Who reports to whom across the site",
    href: "/org-chart",
    icon: "org-chart",
    tile: "bg-violet-50 text-violet-600",
  },
  {
    id: "directory",
    name: "Directory",
    description: "Search everyone by name, title, department or team",
    href: "/directory",
    icon: "directory",
    tile: "bg-emerald-50 text-emerald-600",
  },
  {
    id: "departments",
    name: "Departments",
    description: "People grouped by department and team",
    href: "/departments",
    icon: "departments",
    tile: "bg-amber-50 text-amber-600",
  },
  {
    id: "profile",
    name: "My Profile",
    description: "Your account and position in the chart",
    href: "/profile",
    icon: "profile",
    tile: "bg-sky-50 text-sky-600",
  },
  {
    id: "attendance",
    name: "Attendance",
    description: "Attendance rate overall and by department",
    href: "/attendance",
    icon: "attendance",
    tile: "bg-teal-50 text-teal-600",
    ownerOnly: true,
    hideFromLauncher: true,
  },
  {
    id: "labour",
    name: "Labour Usage",
    description: "How busy each trade and person is through the year",
    href: "/labour",
    icon: "labour",
    tile: "bg-indigo-50 text-indigo-600",
    ownerOnly: true,
    hideFromLauncher: true,
  },
  {
    id: "parts-usage",
    name: "Parts Used",
    description: "Value of auto spare parts used on jobs",
    href: "/parts-usage",
    icon: "parts-usage",
    tile: "bg-orange-50 text-orange-600",
    ownerOnly: true,
    hideFromLauncher: true,
  },
  {
    id: "admin",
    name: "Admin",
    description: "Accounts and data (administrators only)",
    href: "/admin",
    icon: "admin",
    tile: "bg-rose-50 text-rose-600",
    adminOnly: true,
  },
];

export function visibleApps(viewer: {
  role: "admin" | "user";
  isOwner: boolean;
}): AppDef[] {
  const isAdmin = viewer.role === "admin";
  return apps.filter(
    (a) =>
      !a.hideFromLauncher &&
      (!a.adminOnly || isAdmin) &&
      (!a.ownerOnly || isAdmin || viewer.isOwner),
  );
}

export function appForPath(pathname: string): AppDef | undefined {
  return apps.find(
    (a) => a.href !== "#" && (pathname === a.href || pathname.startsWith(a.href + "/")),
  );
}

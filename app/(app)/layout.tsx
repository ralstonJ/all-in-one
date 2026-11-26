import { canSeeBusinessDashboards, requireUser, toViewer } from "@/lib/auth";
import { pendingFor } from "@/lib/time-store";
import { visibleApps } from "@/lib/apps";
import { AppHeader } from "@/components/app-header";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const pending = pendingFor(toViewer(user)).length;
  const apps = visibleApps({ role: user.role, isOwner: canSeeBusinessDashboards(user) }).map((a) =>
    a.id === "approvals" ? { ...a, badge: pending } : a,
  );
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader
        user={{
          displayName: user.displayName,
          username: user.username,
          role: user.role,
          personTitle: user.person?.title ?? null,
        }}
        apps={apps}
      />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}

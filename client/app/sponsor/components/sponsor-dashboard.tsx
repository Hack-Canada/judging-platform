import { DashboardHeader } from "@/app/sponsor/components/dashboard-header";

export function SponsorDashboard() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <DashboardHeader />
      <div className="min-h-0 flex-1 overflow-y-auto bg-muted/40 p-4">
        <h2 className="text-lg font-semibold text-blue-700">Hi Sponsor!</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This is your sponsor dashboard. Details about your booth, perks, and
          event resources will show up here soon.
        </p>
      </div>
    </div>
  );
}

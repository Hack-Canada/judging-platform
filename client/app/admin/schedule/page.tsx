import { getProjects } from "@/lib/queries";
import { deriveSchedule } from "@/lib/schedule";
import { ScheduleManager } from "@/components/admin/schedule-manager";

export const metadata = { title: "Admin · Schedule" };

export default async function SchedulePage() {
  const projects = await getProjects();
  const slots = deriveSchedule(projects);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Schedule manager</h2>
        <p className="text-sm text-muted-foreground">
          Override pitch times, add delays, and search across all projects.
        </p>
      </div>
      <ScheduleManager initialSlots={slots} />
    </div>
  );
}

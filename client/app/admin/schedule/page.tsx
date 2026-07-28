import { getProjects } from "@/lib/queries";
import {
  seedScheduleIfEmpty,
  getScheduleSlots,
  DEFAULT_ROOMS,
} from "@/lib/schedule";
import { ScheduleManager } from "@/components/admin/schedule-manager";
import { AdminPageHeading } from "@/components/admin/page-heading";

export const metadata = { title: "Admin · Schedule" };

export default async function SchedulePage() {
  const projects = await getProjects();
  // Seed the schedule from the derived draft on first visit, then read it back.
  await seedScheduleIfEmpty(projects);
  const slots = await getScheduleSlots();

  return (
    <div className="space-y-6">
      <AdminPageHeading
        title="Schedule manager"
        description="Drag pitches to reschedule, apply quick delays, and search across all projects — changes go live for everyone."
      />
      <ScheduleManager
        initialSlots={slots}
        rooms={DEFAULT_ROOMS}
        projects={projects.map((p) => ({
          id: p.id,
          name: p.project_name,
          track: p.tracks[0] ?? "General",
        }))}
      />
    </div>
  );
}

import { getProjects } from "@/lib/queries";
import {
  seedScheduleIfEmpty,
  getScheduleSlots,
  DEFAULT_ROOMS,
} from "@/lib/schedule";
import { ScheduleManager } from "@/components/admin/schedule-manager";

export const metadata = { title: "Admin · Schedule" };
export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  let projects: Awaited<ReturnType<typeof getProjects>> = [];
  let slots: Awaited<ReturnType<typeof getScheduleSlots>> = [];
  let errorMessage: string | null = null;

  try {
    projects = await getProjects();
    // Seed the schedule from the derived draft on first visit, then read it back.
    await seedScheduleIfEmpty(projects);
    slots = await getScheduleSlots();
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : String(error);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          Schedule manager
        </h2>
        <p className="text-sm text-muted-foreground">
          Override pitch times, add delays, and search across all projects.
        </p>
      </div>
      {errorMessage ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : (
        <ScheduleManager
          initialSlots={slots}
          rooms={DEFAULT_ROOMS}
          projects={projects.map((p) => ({
            id: p.id,
            name: p.project_name,
            track: p.tracks[0] ?? "General",
          }))}
        />
      )}
    </div>
  );
}

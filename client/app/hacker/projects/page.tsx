import { getProjectScheduleSlots, getProjects } from "@/lib/projects";

import { ProjectsHub } from "./projects-hub";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  let result: Awaited<ReturnType<typeof getProjects>> | null = null;
  let scheduleSlots: Awaited<ReturnType<typeof getProjectScheduleSlots>> = [];
  let errorMessage: string | null = null;

  try {
    result = await getProjects();
    scheduleSlots = await getProjectScheduleSlots(result.availableTables);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : String(error);
  }

  return (
    <ProjectsHub
      projects={result?.projects ?? []}
      scheduleSlots={scheduleSlots}
      errorMessage={errorMessage}
    />
  );
}

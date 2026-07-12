import { getProjects } from "@/lib/projects";

import { ProjectsHub } from "./projects-hub";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  let result: Awaited<ReturnType<typeof getProjects>> | null = null;
  let errorMessage: string | null = null;

  try {
    result = await getProjects();
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : String(error);
  }

  return (
    <ProjectsHub
      projects={result?.projects ?? []}
      errorMessage={errorMessage}
    />
  );
}

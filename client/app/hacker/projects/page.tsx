import { getProjects } from "@/lib/projects";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  let result: Awaited<ReturnType<typeof getProjects>> | null = null;
  let errorMessage: string | null = null;

  try {
    result = await getProjects();
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : String(error);
  }

  const projects = result?.projects ?? [];
  const progressValue = 0;

  return (
    <main className="min-h-screen bg-white p-6 text-black flex flex-col">
      {/* top area */}
      <div className="w-full min-h-[200px] h-[10%] flex flex-col items-center gap-4">
        <input
          placeholder="Search Projects By Name"
          className="w-[50%] h-[20px] border-1 rounded-xl p-4"
        ></input>
        <div className="w-[50%] h-full flex gap-4">
          <Button className="cursor-pointer">All Projects</Button>
          <Button className="cursor-pointer">Pending Review</Button>
          <Button className="cursor-pointer">Judged</Button>
          <Button className="cursor-pointer">Favourites</Button>
        </div>
      </div>
      {/* progress line */}
      <div className="w-full h-[10%] flex flex-col gap-2 items-center">
        <div className="flex justify-between w-[50%] h-[50%]">
          <p className="text-neutral-color">Judging Progress</p>
          <p className="text-neutral-color">0 / {projects.length}</p>
        </div>
        <div className="w-[50%] h-[50%]">
          <Progress value={progressValue} />
        </div>
      </div>
      <div className="w-full flex justify-center mt-8">
        <div className="grid w-full max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {errorMessage ? (
            <div className="col-span-full rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : projects.length === 0 ? (
            <div className="col-span-full rounded-lg border border-neutral-200 p-8 text-center text-neutral-500">
              No projects found.
            </div>
          ) : (
            projects.map((project) => (
              <article
                key={project.id}
                className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-neutral-950">
                      {project.project_name}
                    </h2>
                    {project.team_name ? (
                      <p className="mt-1 text-sm text-neutral-500">
                        {project.team_name}
                      </p>
                    ) : null}
                  </div>

                  {project.devpost_link ? (
                    <Button size="sm" variant="outline" asChild>
                      <a href={project.devpost_link}>View</a>
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" disabled>
                      View
                    </Button>
                  )}
                </div>

                <p className="mt-4 line-clamp-3 text-sm text-neutral-700">
                  {project.members.length > 0
                    ? project.members.join(", ")
                    : (project.name ?? "No submitter listed")}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {project.tracks?.map((track) => (
                    <span
                      key={track}
                      className="rounded-md bg-neutral-100 px-2 py-1 text-xs text-neutral-700"
                    >
                      {track}
                    </span>
                  ))}
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </main>
  );
}

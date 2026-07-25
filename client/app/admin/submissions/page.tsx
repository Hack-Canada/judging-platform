import { getProjects } from "@/lib/queries";
import { SubmissionsManager } from "@/components/admin/submissions-manager";

export const metadata = { title: "Admin · Submissions" };
export const dynamic = "force-dynamic";

export default async function SubmissionsPage() {
  let projects: Awaited<ReturnType<typeof getProjects>> = [];
  let errorMessage: string | null = null;

  try {
    projects = await getProjects();
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : String(error);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Hacker submissions</h2>
        <p className="text-sm text-muted-foreground">
          Every project submitted. Edit details or remove a submission — changes
          write straight to the database.
        </p>
      </div>
      {errorMessage ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : (
        <SubmissionsManager initialProjects={projects} />
      )}
    </div>
  );
}

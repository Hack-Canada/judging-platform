import { getProjects } from "@/lib/queries";
import { SubmissionsManager } from "@/components/admin/submissions-manager";

export const metadata = { title: "Admin · Submissions" };

export default async function SubmissionsPage() {
  const projects = await getProjects();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Hacker submissions</h2>
        <p className="text-sm text-muted-foreground">
          Every project submitted. Edit details or remove a submission — changes
          write straight to the database.
        </p>
      </div>
      <SubmissionsManager initialProjects={projects} />
    </div>
  );
}

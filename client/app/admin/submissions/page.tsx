import { getProjects } from "@/lib/queries";
import { SubmissionsManager } from "@/components/admin/submissions-manager";
import { AdminPageHeading } from "@/components/admin/page-heading";

export const metadata = { title: "Admin · Submissions" };

export default async function SubmissionsPage() {
  const projects = await getProjects();

  return (
    <div className="space-y-6">
      <AdminPageHeading
        title="Hacker submissions"
        description="Every project submitted. Edit details or remove a submission — changes write straight to the database."
      />
      <SubmissionsManager initialProjects={projects} />
    </div>
  );
}

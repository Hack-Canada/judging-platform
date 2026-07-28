import { updateProject, deleteProject, type ProjectUpdate } from "@/lib/queries";

// Admin submission mutations. Reads happen server-side in the page; these
// handlers back the edit dialog and delete action on /admin/submissions.
// Namespaced under /api/admin to avoid colliding with the hacker portal's
// read-only /api/projects (linus/hacker).

function toArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(/[\n,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function toNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = (await request.json()) as Record<string, unknown>;

    const projectName = toNullableString(body.project_name);
    if (!projectName) {
      return Response.json(
        { ok: false, error: "Project name is required." },
        { status: 400 }
      );
    }

    const fields: ProjectUpdate = {
      project_name: projectName,
      tracks: toArray(body.tracks),
      submitter_name: toNullableString(body.submitter_name),
      submitter_email: toNullableString(body.submitter_email),
      members: toArray(body.members),
    };

    const updated = await updateProject(id, fields);
    if (!updated) {
      return Response.json({ ok: false, error: "Submission not found." }, { status: 404 });
    }
    return Response.json({ ok: true, project: updated });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const deleted = await deleteProject(id);
    if (!deleted) {
      return Response.json({ ok: false, error: "Submission not found." }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

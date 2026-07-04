import { JudgingPortal } from "./judging-portal";
import { getJudgingProjects, getJudgingSlots } from "@/lib/judging/get-data";

export const dynamic = "force-dynamic";

export default async function JudgingPage() {
  const { projects, source, mockReason } = await getJudgingProjects();
  const slots = getJudgingSlots(projects, source);

  return (
    <JudgingPortal
      projects={projects}
      slots={slots}
      dataSource={source}
      mockReason={mockReason}
    />
  );
}

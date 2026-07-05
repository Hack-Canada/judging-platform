import { JudgingPortal } from "./judging-portal";
import { JudgingErrorScreen } from "@/components/judging/judging-error-screen";
import { getScheduleOffsetMinutes } from "@/lib/judging/db-setup";
import {
  getJudgingProjects,
  getJudgingSlots,
  pickInitialStream,
} from "@/lib/judging/get-data";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ stream?: string; organizer?: string; code?: string }>;
};

export default async function JudgingPage({ searchParams }: PageProps) {
  const params = await searchParams;

  let projects;
  let streams;
  let source;
  let mockReason;
  let slots;
  let initialStreamId;
  let initialScheduleOffset;
  let loadError: string | undefined;

  try {
    const data = await getJudgingProjects();
    projects = data.projects;
    streams = data.streams;
    source = data.source;
    mockReason = data.mockReason;
    slots = getJudgingSlots(projects, source);
    initialStreamId = pickInitialStream(streams, slots, params.stream);
    initialScheduleOffset = await getScheduleOffsetMinutes();
  } catch (error) {
    loadError =
      error instanceof Error ? error.message : "Something went wrong loading judging data.";
  }

  if (loadError) {
    return <JudgingErrorScreen message={loadError} />;
  }

  const showOrganizerPanel = params.organizer === "1";

  return (
    <JudgingPortal
      projects={projects!}
      slots={slots!}
      streams={streams!}
      dataSource={source!}
      mockReason={mockReason}
      initialStreamId={initialStreamId}
      initialScheduleOffset={initialScheduleOffset}
      initialJudgeCode={params.code}
      showOrganizerPanel={showOrganizerPanel}
    />
  );
}

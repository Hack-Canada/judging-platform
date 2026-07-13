import { JudgingPortal } from "./judging-portal";
import { JudgingErrorScreen } from "@/components/judging/judging-error-screen";
import { getScheduleOffsetMinutes } from "@/lib/judging/db-setup";
import {
  getJudgingDataset,
  parseProjectAllowList,
  pickInitialStream,
} from "@/lib/judging/get-data";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    stream?: string;
    code?: string;
    /** Comma-separated project IDs - client-only assignment filter. */
    projects?: string;
  }>;
};

export default async function JudgingPage({ searchParams }: PageProps) {
  const params = await searchParams;

  let projects;
  let streams;
  let slots;
  let initialStreamId;
  let initialScheduleOffset;
  let scheduleApproximate;
  let loadError: string | undefined;

  try {
    const data = await getJudgingDataset({
      projectAllowList: parseProjectAllowList(params.projects),
    });
    projects = data.projects;
    streams = data.streams;
    slots = data.slots;
    scheduleApproximate = data.scheduleApproximate;
    initialStreamId = pickInitialStream(streams, slots, params.stream);
    initialScheduleOffset = await getScheduleOffsetMinutes();
  } catch (error) {
    loadError =
      error instanceof Error ? error.message : "Something went wrong loading judging data.";
  }

  if (loadError) {
    return <JudgingErrorScreen message={loadError} />;
  }

  const streamLocked = Boolean(params.stream?.trim());

  return (
    <JudgingPortal
      projects={projects!}
      slots={slots!}
      streams={streams!}
      initialStreamId={initialStreamId}
      initialScheduleOffset={initialScheduleOffset}
      initialJudgeCode={params.code}
      scheduleApproximate={scheduleApproximate}
      streamLocked={streamLocked}
    />
  );
}

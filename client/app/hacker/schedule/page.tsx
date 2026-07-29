import {
  HackathonSchedule,
  type ScheduleColumn,
} from "./HackathonSchedule";
import { getHackerSchedule } from "./data";

export const dynamic = "force-dynamic";

const columns: ScheduleColumn[] = [
  { key: "main", label: "MAIN EVENT", type: "main" },
  { key: "sponsorWorkshop", label: "SPONSOR\nWORKSHOPS", type: "sponsor" },
  { key: "otherWorkshop", label: "OTHER\nWORKSHOPS", type: "workshop" },
  { key: "activities1", label: "ACTIVITIES", type: "activity" },
  { key: "food", label: "FOOD", type: "food" },
  { key: "sponsorBooth", label: "SPONSOR\nBOOTH", type: "booth" },
  { key: "judging", label: "JUDGING", type: "judging" },
  { key: "other", label: "OTHER", type: "other" },
];

export default async function SchedulePage() {
  const schedule = await getHackerSchedule();

  return <HackathonSchedule columns={columns} days={schedule} />;
}

import { SponsorDashboard } from "@/app/sponsor/components/sponsor-dashboard";
import { getDemoSponsorAssignments } from "@/db/queries";

export const dynamic = "force-dynamic";

export default async function SponsorPage() {
  let events: Awaited<ReturnType<typeof getDemoSponsorAssignments>> = [];

  try {
    events = await getDemoSponsorAssignments();
  } catch {
    events = [];
  }

  return <SponsorDashboard events={events} />;
}

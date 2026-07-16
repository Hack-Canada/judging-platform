import { SponsorDashboard } from "@/app/sponsor/components/sponsor-dashboard";
import { getDemoSponsorAssignments } from "@/db/queries";

export default async function SponsorPage() {
  const events = await getDemoSponsorAssignments();
  return <SponsorDashboard events={events} />;
}

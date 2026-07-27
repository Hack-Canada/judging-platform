import { SponsorDashboard } from "@/app/sponsor/SponsorDashboard";
import { getDemoSponsorSchedule } from "@/db/queries";

export default async function SponsorPage() {
  const events = await getDemoSponsorSchedule();
  return <SponsorDashboard events={events} />;
}

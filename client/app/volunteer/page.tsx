import { VolunteerDashboard } from "@/app/volunteer/components/volunteer-dashboard";
import { getDemoVolunteerShifts } from "@/db/queries";

export default async function VolunteerPage() {
  const shifts = await getDemoVolunteerShifts();
  return <VolunteerDashboard shifts={shifts} />;
}

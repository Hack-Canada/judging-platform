import { VolunteerDashboard } from "@/app/volunteer/VolunteerDashboard";
import { getDemoVolunteerShifts } from "@/db/queries";

export default async function VolunteerPage() {
  const shifts = await getDemoVolunteerShifts();
  return <VolunteerDashboard shifts={shifts} />;
}

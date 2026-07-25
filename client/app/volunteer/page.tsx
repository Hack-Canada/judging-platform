import { VolunteerDashboard } from "@/app/volunteer/components/volunteer-dashboard";
import { getDemoVolunteerShifts } from "@/db/queries";

export const dynamic = "force-dynamic";

export default async function VolunteerPage() {
  let shifts: Awaited<ReturnType<typeof getDemoVolunteerShifts>> = [];

  try {
    shifts = await getDemoVolunteerShifts();
  } catch {
    shifts = [];
  }

  return <VolunteerDashboard shifts={shifts} />;
}

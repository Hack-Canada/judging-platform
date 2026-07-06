import { VolunteerDashboard } from "@/app/volunteer/components/volunteer-dashboard";
import { mockShifts } from "@/app/volunteer/data/shifts";

export default function VolunteerPage() {
  return <VolunteerDashboard shifts={mockShifts} />;
}

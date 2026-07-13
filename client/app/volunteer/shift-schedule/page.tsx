import { getDemoVolunteerShifts } from "@/db/queries";
import { ScheduleViewSwitcher } from "@/components/schedule/schedule-view-switcher";

export default async function ShiftSchedulePage() {
  const shifts = await getDemoVolunteerShifts();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-muted/40 p-4">
      <div>
        <h1 className="text-2xl text-blue-700 font-semibold">Shift Schedule</h1>
        <p className="text-sm text-muted-foreground">All of your assigned shifts.</p>
      </div>
      <ScheduleViewSwitcher
        items={shifts.map((shift) => ({
          id: shift.id,
          title: shift.title,
          location: shift.location,
          startTime: shift.startTime,
          endTime: shift.endTime,
          description: shift.description,
          assignments: [{ name: shift.teamLead || "You", role: shift.role }],
        }))}
      />
    </div>
  );
}

"use client";

import Link from "next/link";
import { ScheduleOffsetPanel } from "@/components/judging/schedule-offset-panel";
import { useState } from "react";

type AdminPageProps = {
  initialScheduleOffset: number;
};

export function AdminScheduleControls({ initialScheduleOffset }: AdminPageProps) {
  const [offset, setOffset] = useState(initialScheduleOffset);

  return (
    <div className="mx-auto max-w-lg space-y-6 p-8">
      <div>
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Portals
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Admin</h1>
        <p className="mt-2 text-muted-foreground">
          Event controls for organizers. Judges see changes automatically.
        </p>
      </div>
      <ScheduleOffsetPanel initialOffset={offset} onOffsetChange={setOffset} />
      <p className="text-sm text-muted-foreground">
        Or open{" "}
        <Link href="/judging?organizer=1" className="underline">
          /judging?organizer=1
        </Link>{" "}
        on a phone at the organizer desk.
      </p>
    </div>
  );
}

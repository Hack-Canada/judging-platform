"use client";

import { useActionState, useEffect, useState } from "react";
import { updateSlot, deleteSlot } from "./actions";

type SubmissionOption = { id: string; projectName: string };

type Slot = {
  id: string;
  submissionId: string;
  projectName: string;
  startTime: Date;
  endTime: Date;
  room: string;
  notes: string | null;
};

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatRange(start: Date, end: Date) {
  const t = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${t(start)} - ${t(end)}`;
}

export function SlotRow({
  slot,
  submissions,
}: {
  slot: Slot;
  submissions: SubmissionOption[];
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(updateSlot, {});

  useEffect(() => {
    if (state.success) setEditing(false);
  }, [state]);

  const field =
    "mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm";

  if (!editing) {
    return (
      <li className="flex items-center justify-between gap-4 px-4 py-3">
        <div>
          <p className="font-medium text-gray-900">{slot.projectName}</p>
          <p className="text-xs text-gray-500">
            {formatRange(slot.startTime, slot.endTime)} · {slot.room}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditing(true)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Edit
          </button>
          <form
            action={deleteSlot}
            onSubmit={(e) => {
              if (!confirm("Delete this slot?")) e.preventDefault();
            }}
          >
            <input type="hidden" name="id" value={slot.id} />
            <button
              type="submit"
              className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          </form>
        </div>
      </li>
    );
  }

  return (
    <li className="px-4 py-3">
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="id" value={slot.id} />

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Project
          </label>
          <select
            name="submissionId"
            defaultValue={slot.submissionId}
            required
            className={field}
          >
            {submissions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.projectName}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Start time
            </label>
            <input
              type="datetime-local"
              name="startTime"
              defaultValue={toLocalInput(slot.startTime)}
              required
              className={field}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              End time
            </label>
            <input
              type="datetime-local"
              name="endTime"
              defaultValue={toLocalInput(slot.endTime)}
              required
              className={field}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Room</label>
          <input
            type="text"
            name="room"
            defaultValue={slot.room}
            required
            className={field}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Notes <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            name="notes"
            rows={2}
            defaultValue={slot.notes ?? ""}
            className={field}
          />
        </div>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {pending ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </li>
  );
}
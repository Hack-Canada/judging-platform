"use client";

import { useActionState } from "react";
import { createSlot } from "./actions";

type SubmissionOption = {
  id: string;
  projectName: string;
};

export function ScheduleForm({
  submissions,
}: {
  submissions: SubmissionOption[];
}) {
  const [state, formAction, pending] = useActionState(createSlot, {});

  const field =
    "mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm";

  return (
    <form action={formAction} className="mt-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Project
        </label>
        <select name="submissionId" defaultValue="" required className={field}>
          <option value="" disabled>
            Select a project
          </option>
          {submissions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.projectName}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Start time
          </label>
          <input
            type="datetime-local"
            name="startTime"
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
          placeholder="Room A"
          required
          className={field}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Notes <span className="text-gray-400">(optional)</span>
        </label>
        <textarea name="notes" rows={2} className={field} />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        {pending ? "Saving..." : "Create slot"}
      </button>
    </form>
  );
}
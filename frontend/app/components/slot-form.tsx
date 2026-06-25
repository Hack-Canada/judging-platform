"use client";

import Link from "next/link";
import { useState } from "react";
import type { Submission, JudgingSlot } from "@/db/schema";

const inputClass =
  "w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500";

function toDatePart(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toTimePart(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function SlotForm({
  submissions,
  slot,
  action,
  submitLabel,
  cancelHref,
}: {
  submissions: Submission[];
  slot?: JudgingSlot;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  cancelHref?: string;
}) {
  const [submissionId, setSubmissionId] = useState(slot?.submissionId ?? "");
  const [startDate, setStartDate] = useState(slot ? toDatePart(slot.startTime) : "");
  const [startTimeOfDay, setStartTimeOfDay] = useState(slot ? toTimePart(slot.startTime) : "");
  const [endDate, setEndDate] = useState(slot ? toDatePart(slot.endTime) : "");
  const [endTimeOfDay, setEndTimeOfDay] = useState(slot ? toTimePart(slot.endTime) : "");
  const [room, setRoom] = useState(slot?.room ?? "");

  const isComplete =
    submissionId !== "" &&
    startDate !== "" &&
    startTimeOfDay !== "" &&
    endDate !== "" &&
    endTimeOfDay !== "" &&
    room.trim() !== "";

  return (
    <form action={action} noValidate className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Project */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Project
          </label>
          <div className="relative">
            <select
              name="submissionId"
              value={submissionId}
              onChange={(e) => setSubmissionId(e.target.value)}
              className={`${inputClass} appearance-none pr-8`}
            >
              <option value="" disabled>
                Select a project…
              </option>
              {submissions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.projectName}
                </option>
              ))}
            </select>
            <svg
              className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {/* Start date + time */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Start date
          </label>
          <input
            type="date"
            name="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Start time
          </label>
          <input
            type="time"
            name="startTimeOfDay"
            value={startTimeOfDay}
            onChange={(e) => setStartTimeOfDay(e.target.value)}
            className={inputClass}
          />
        </div>

        {/* End date + time */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            End date
          </label>
          <input
            type="date"
            name="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            End time
          </label>
          <input
            type="time"
            name="endTimeOfDay"
            value={endTimeOfDay}
            onChange={(e) => setEndTimeOfDay(e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Room */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Room
          </label>
          <input
            type="text"
            name="room"
            placeholder="e.g. Room A, Table 3"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            className={`${inputClass} placeholder:text-zinc-400`}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Notes <span className="text-zinc-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            name="notes"
            placeholder="Any additional notes…"
            defaultValue={slot?.notes ?? ""}
            className={`${inputClass} placeholder:text-zinc-400`}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!isComplete}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
        >
          {submitLabel}
        </button>
        {cancelHref && (
          <Link
            href={cancelHref}
            className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            Cancel
          </Link>
        )}
      </div>
    </form>
  );
}

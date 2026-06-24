"use client";

import { deleteJudgingSlot } from "./actions";

type DeleteSlotButtonProps = {
  projectName: string;
  slotId: string;
};

export default function DeleteSlotButton({
  projectName,
  slotId,
}: DeleteSlotButtonProps) {
  return (
    <form action={deleteJudgingSlot}>
      <input name="slotId" type="hidden" value={slotId} />
      <button
        className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
        type="submit"
        onClick={(event) => {
          if (!window.confirm(`Delete the judging slot for ${projectName}?`)) {
            event.preventDefault();
          }
        }}
      >
        Delete
      </button>
    </form>
  );
}

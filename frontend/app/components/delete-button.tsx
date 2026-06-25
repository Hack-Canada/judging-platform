"use client";

import { deleteSlot } from "@/app/admin/actions";

export function DeleteButton({ id }: { id: string }) {
  return (
    <form action={deleteSlot.bind(null, id)}>
      <button
        type="submit"
        onClick={(e) => {
          if (!window.confirm("Delete this slot?")) e.preventDefault();
        }}
        className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-md transition-colors"
      >
        Delete
      </button>
    </form>
  );
}

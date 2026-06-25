import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
      <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">
        Judging Platform — Onboarding
      </h1>
     
      <div className="flex gap-3 mt-2">
        <Link
          href="/schedule"
          className="px-5 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:opacity-90"
        >
          View Schedule
        </Link>
        <Link
          href="/admin"
          className="px-5 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700"
        >
          Admin Panel
        </Link>
      </div>
    </div>
  );
}

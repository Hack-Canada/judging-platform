import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-full bg-slate-50 px-4 py-10 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
            Mini judging platform
          </p>
          <h1 className="mt-3 text-3xl font-semibold">
            HackCanada Judging
          </h1>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              className="rounded-md bg-emerald-700 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-emerald-800"
              href="/admin"
            >
              Open admin
            </Link>
            <Link
              className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
              href="/schedule"
            >
              View schedule
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

import Link from "next/link";

export default function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link className="text-base font-semibold text-slate-950" href="/">
          HackCanada Judging
        </Link>
        <div className="flex items-center gap-1">
          <Link
            className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
            href="/schedule"
          >
            Schedule
          </Link>
          <Link
            className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
            href="/admin"
          >
            Admin
          </Link>
        </div>
      </nav>
    </header>
  );
}

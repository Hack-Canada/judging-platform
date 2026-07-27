import { Gavel } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { Toaster } from "@/components/ui/sonner";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-[var(--bg-light)] text-[var(--text-body)]">
      <header className="sticky top-0 z-30 border-b border-[color:var(--bg-gray-dark)]/60 bg-white/85 backdrop-blur">
        <div className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6">
          <div className="mb-3 hidden flex-wrap items-center gap-x-3 gap-y-1 sm:flex">
            <span className="grid size-7 place-items-center rounded-lg bg-[var(--brand-primary)] text-white shadow-sm">
              <Gavel className="size-4" />
            </span>
            <h1 className="[font-family:var(--font-figtree)] text-lg font-black tracking-tight text-[var(--brand-secondary)]">
              Admin
            </h1>
            <span className="text-sm text-[var(--text-secondary)]">
              HackCanada Judging Platform
            </span>
          </div>
          <AdminNav />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
      <Toaster />
    </div>
  );
}

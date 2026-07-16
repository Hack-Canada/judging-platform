import { AdminNav } from "@/components/admin/admin-nav";
import { Toaster } from "@/components/ui/sonner";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
      <header className="border-b bg-card">
        <div className="mx-auto w-full max-w-6xl px-6 py-4">
          <div className="mb-3 flex items-baseline gap-3">
            <h1 className="text-lg font-semibold tracking-tight">Admin</h1>
            <span className="text-sm text-muted-foreground">
              HackCanada Judging Platform
            </span>
          </div>
          <AdminNav />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {children}
      </main>
      <Toaster />
    </div>
  );
}

import Link from "next/link";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Sidebar } from "@/app/volunteer/Sidebar";
import { MobileNavTrigger } from "@/app/volunteer/MobileNavTrigger";

export default function VolunteerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider className="h-svh">
      <Sidebar />
      <SidebarInset className="h-svh overflow-hidden bg-[var(--bg-gray)]">
        <header className="flex shrink-0 items-center gap-2 border-b border-[color:var(--bg-gray-dark)]/55 bg-[var(--bg-white)] p-3 md:hidden">
          <MobileNavTrigger />
          <Link
            href="/"
            className="[font-family:var(--font-fredoka)] text-lg font-semibold tracking-[-0.02em] text-[var(--brand-secondary)]"
          >
            HackCanada
          </Link>
        </header>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

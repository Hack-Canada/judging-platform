import Link from "next/link";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SponsorSidebar } from "@/app/sponsor/components/sponsor-sidebar";
import { MobileNavTrigger } from "@/app/sponsor/components/mobile-nav-trigger";

export default function SponsorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider className="h-svh">
      <SponsorSidebar />
      <SidebarInset className="h-svh overflow-hidden">
        <header className="flex shrink-0 items-center gap-2 border-b p-3 md:hidden">
          <MobileNavTrigger />
          <Link href="/" className="text-lg font-semibold text-blue-700">
            Hack Canada
          </Link>
        </header>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

import Link from "next/link";
import Image from "next/image";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { VolunteerSidebar } from "@/app/volunteer/components/volunteer-sidebar";
import { MobileNavTrigger } from "@/app/volunteer/components/mobile-nav-trigger";
import hackCanadaLogo from "@/app/hackcanada.png";

export default function VolunteerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider className="h-svh">
      <VolunteerSidebar />
      <SidebarInset className="h-svh overflow-hidden">
        <header className="flex shrink-0 items-center gap-2 border-b p-3 md:hidden">
          <MobileNavTrigger />
          <Link href="/" className="flex items-center gap-2">
            <Image src={hackCanadaLogo} alt="" width={24} height={24} />
            <span className="text-lg font-semibold text-blue-700">Hack Canada</span>
          </Link>
        </header>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

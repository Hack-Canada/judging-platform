import Link from "next/link";

const sidebarLinks = [
  { label: "Dashboard", href: "/hacker" },
  { label: "Submission", href: "/hacker/submission" },
  { label: "Projects", href: "/hacker/projects" },
] as const;

export function SideBar() {
  return (
    <div className="flex h-screen flex-col bg-[#0099CC] p-4 w-64">
      <div className="border-b border-white/25 pb-6">
        <p className="text-lg font-semibold">HackCanada</p>
        <p className="text-sm text-white/80">Hacker Portal</p>
      </div>

      <nav className="mt-6 flex flex-1 flex-col gap-2">
        {sidebarLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-md px-3 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/15 hover:text-white"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-white/25 pt-4 text-sm text-white/75">
        Need help?
      </div>
    </div>
  );
}

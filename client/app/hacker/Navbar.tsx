import Link from "next/link";

export function Navbar() {
  const left_navbar = [{ label: "Home", href: "/hacker" }] as const;

  const right_navbar = [
    { label: "Submission", href: "/hacker/submission" },
    { label: "Projects", href: "/hacker/projects" },
    { label: "Schedule", href: "/hacker/schedule" },
  ] as const;

  return (
    <nav className="w-screen h-[10%] flex justify-between p-4 bg-background-color">
      <div>
        {left_navbar.map((portal) => (
          <Link
            key={portal.href}
            href={portal.href}
            className="text-neutral-color"
          >
            {portal.label}
          </Link>
        ))}
      </div>
      <div className="flex gap-4 ">
        {right_navbar.map((portal) => (
          <Link
            key={portal.href}
            href={portal.href}
            className="text-neutral-color"
          >
            {portal.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

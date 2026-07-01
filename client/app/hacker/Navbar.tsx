import { Button } from "@/components/ui/button";
import Link from "next/link";

export function Navbar() {
  const left_navbar = [{ label: "Home", href: "/hacker" }] as const;

  const right_navbar = [
    { label: "Submission", href: "/hacker/submission" },
    { label: "Projects", href: "/hacker/projects" },
  ] as const;

  return (
    <nav className="w-screen h-[10%] flex justify-between p-4">
      <div>
        {left_navbar.map((portal) => (
          <a key={portal.href} className="">
            <Link href={portal.href}>{portal.label}</Link>
          </a>
        ))}
      </div>
      <div className="flex gap-4 ">
        {right_navbar.map((portal) => (
          <a key={portal.href} className="">
            <Link href={portal.href}>{portal.label}</Link>
          </a>
        ))}
      </div>
    </nav>
  );
}

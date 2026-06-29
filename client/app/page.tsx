import Link from "next/link";
import { Button } from "@/components/ui/button";

const portals = [
  { label: "Judging", href: "/judging" },
  { label: "Hacker", href: "/hacker" },
  { label: "Volunteer", href: "/volunteer" },
  { label: "Sponsor", href: "/sponsor" },
  { label: "Admin", href: "/admin" },
] as const;

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl space-y-10 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            HackCanada Judging Platform
          </h1>
          <p className="text-primary-foreground/80">Choose your portal to continue</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {portals.map((portal) => (
            <Button
              key={portal.href}
              variant="secondary"
              size="lg"
              className="h-14 text-base text-primary"
              asChild
            >
              <Link href={portal.href}>{portal.label}</Link>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

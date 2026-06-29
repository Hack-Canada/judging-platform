import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PortalStub({ title }: { title: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-primary-foreground/80">This portal is coming soon.</p>
      <Button variant="secondary" className="text-primary" asChild>
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  );
}

"use client";

import {
  CalendarDays,
  FolderKanban,
  House,
  Menu,
  Send,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type SidebarLink = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const sidebarLinks: SidebarLink[] = [
  { label: "Home", href: "/hacker", icon: House },
  { label: "Schedule", href: "/hacker/schedule", icon: CalendarDays },
  { label: "Food", href: "/hacker/food", icon: UtensilsCrossed },
  { label: "Submission", href: "/hacker/submission", icon: Send },
  { label: "Projects", href: "/hacker/projects", icon: FolderKanban },
];

function isRouteActive(pathname: string, href: string) {
  return href === "/hacker"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

function navigationLinkClassName(isActive: boolean) {
  return `group relative flex min-h-[54px] items-center gap-4 rounded-xl px-4 py-3 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)] ${
    isActive
      ? "bg-white text-[var(--brand-secondary)] shadow-[0_10px_24px_rgba(15,42,67,0.1)]"
      : "text-[var(--text-secondary)] hover:bg-white/55 hover:text-[var(--brand-secondary)]"
  }`;
}

function NavigationLinkContent({
  link,
  isActive,
}: {
  link: SidebarLink;
  isActive: boolean;
}) {
  const Icon = link.icon;

  return (
    <>
      <span className="flex size-6 shrink-0 items-center justify-center">
        <Icon className="size-[21px]" strokeWidth={1.9} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 [font-family:var(--font-figtree)] text-[15px] font-semibold leading-5">
        {link.label}
      </span>
      {isActive && (
        <span
          aria-hidden="true"
          className="size-1.5 shrink-0 rounded-full bg-[var(--brand-accent)] shadow-[0_0_0_4px_rgba(0,208,192,0.1)]"
        />
      )}
    </>
  );
}

function NavigationLink({
  link,
  isActive,
}: {
  link: SidebarLink;
  isActive: boolean;
}) {
  return (
    <Link
      href={link.href}
      aria-current={isActive ? "page" : undefined}
      className={navigationLinkClassName(isActive)}
    >
      <NavigationLinkContent link={link} isActive={isActive} />
    </Link>
  );
}

function BrandStripe({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`flex h-1 overflow-hidden rounded-full ${className}`}
    >
      <span className="flex-[2] bg-[var(--brand-primary)]" />
      {/* <span className="flex-1 bg-[var(--brand-accent)]" />
      <span className="flex-1 bg-[var(--bg-warning)]" /> */}
    </div>
  );
}

export function SideBar() {
  const pathname = usePathname();

  return (
    <>
      <header className="z-40 flex h-16 shrink-0 items-center justify-between border-b border-[color:var(--bg-gray-dark)]/55 bg-white px-4 lg:hidden">
        <Link
          href="/hacker"
          className="[font-family:var(--font-fredoka)] text-xl font-semibold tracking-[-0.02em] text-[var(--brand-secondary)]"
        >
          Hack<span className="text-[var(--text-primary)]">Canada</span>
        </Link>

        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-full border border-[var(--bg-gray-dark)] bg-[var(--bg-light)] text-[var(--brand-secondary)] transition-colors hover:bg-[var(--bg-primary-light)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]"
              aria-label="Open hacker navigation"
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="border-[color:var(--brand-primary)]/18 bg-[linear-gradient(180deg,#eef7ff_0%,#dcebfb_58%,#cfe5fb_100%)] p-0 text-[var(--text-body)] [&_[data-slot=sheet-close]]:text-[var(--brand-secondary)] [&_[data-slot=sheet-close]]:hover:bg-white/60"
          >
            <SheetHeader className="border-b border-[color:var(--brand-primary)]/15 px-6 pb-6 pt-7">
              <SheetTitle className="[font-family:var(--font-fredoka)] text-2xl font-semibold tracking-[-0.03em] text-[var(--brand-secondary)]">
                Hack
                <span className="text-[var(--text-primary)]">Canada</span>
              </SheetTitle>
              <SheetDescription className="[font-family:var(--font-figtree)] text-[var(--text-secondary)]">
                Navigate your hacking weekend.
              </SheetDescription>
            </SheetHeader>
            <nav
              aria-label="Hacker portal"
              className="mx-4 mt-5 flex flex-col gap-1 p-1"
            >
              {sidebarLinks.map((link) => {
                const isActive = isRouteActive(pathname, link.href);

                return (
                  <SheetClose asChild key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={isActive ? "page" : undefined}
                      className={navigationLinkClassName(isActive)}
                    >
                      <NavigationLinkContent link={link} isActive={isActive} />
                    </Link>
                  </SheetClose>
                );
              })}
            </nav>
            <BrandStripe className="mx-6 mt-6 opacity-90" />
          </SheetContent>
        </Sheet>
      </header>

      <aside className="hidden h-dvh w-[270px] shrink-0 bg-[var(--bg-light)] p-4 lg:block">
        <div className="relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/80 bg-[linear-gradient(180deg,#eef7ff_0%,#dcebfb_58%,#cfe5fb_100%)] px-5 pb-5 pt-7 shadow-[0_18px_42px_rgba(77,163,255,0.12)]">
          {/* <div
            aria-hidden="true"
            className="absolute -bottom-20 -left-16 h-48 w-64 rotate-6 rounded-[50%] bg-[var(--brand-primary)]/12"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-28 -right-16 h-52 w-64 -rotate-12 rounded-[50%] bg-[var(--brand-accent)]/10"
          /> */}

          <div className="relative px-3 pb-6">
            <Link
              href="/hacker"
              className="[font-family:var(--font-fredoka)] text-[1.65rem] font-semibold tracking-[-0.03em] text-[var(--brand-secondary)]"
            >
              HackCanada
            </Link>
            <BrandStripe className="mt-5 max-w-[112px]" />
          </div>

          {/* <div
            aria-hidden="true"
            className="h-px bg-[color:var(--brand-secondary)]/10"
          /> */}

          <nav
            aria-label="Hacker portal"
            className="relative mt-5 flex flex-col gap-1"
          >
            {sidebarLinks.map((link) => (
              <NavigationLink
                key={link.href}
                link={link}
                isActive={isRouteActive(pathname, link.href)}
              />
            ))}
          </nav>

          <div className="relative mt-auto px-3 pb-1">
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-[var(--brand-accent)]"
              />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

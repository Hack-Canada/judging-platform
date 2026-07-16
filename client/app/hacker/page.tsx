import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Code2,
  ExternalLink,
  HelpCircle,
  Instagram,
  Linkedin,
  LifeBuoy,
  MapPin,
  MessageCircle,
  Send,
  Trophy,
  Users,
  Utensils,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const dashboardActions = [
  {
    title: "Schedule",
    description: "Talks, workshops, meals, and judging blocks.",
    href: "/hacker/schedule",
    icon: CalendarClock,
  },
  {
    title: "Food",
    description: "Meal times, menus, allergens, and snack updates.",
    href: "/hacker/food",
    icon: Utensils,
  },
  {
    title: "Location",
    description: "Rooms, judging areas, help desk, and workspaces.",
    href: "/hacker/location",
    icon: MapPin,
  },
  {
    title: "Submission",
    description: "Project details, team members, links, and tracks.",
    href: "/hacker/submission",
    icon: Send,
  },
  {
    title: "Projects",
    description: "Browse submissions and check judging slots.",
    href: "/hacker/projects",
    icon: Code2,
  },
] as const;

const communityLinks = [
  {
    label: "Discord",
    description: "Fastest place for announcements and organizer support.",
    href: "https://discord.gg/hackcanada",
    icon: MessageCircle,
  },
  {
    label: "Instagram",
    description: "Photos, reminders, and event updates.",
    href: "https://instagram.com/hackcanada",
    icon: Instagram,
  },
  {
    label: "LinkedIn",
    description: "Sponsor, career, and post-event updates.",
    href: "https://linkedin.com/company/hackcanada",
    icon: Linkedin,
  },
] as const;

const helpChannels = [
  {
    title: "Mentor Queue",
    description: "Get technical help for APIs, debugging, design, or pitching.",
    meta: "Open during hacking",
    icon: Users,
  },
  {
    title: "Organizer Desk",
    description: "Questions about food, rooms, hardware, judging, or rules.",
    meta: "Main lobby",
    icon: LifeBuoy,
  },
  {
    title: "Judging Prep",
    description: "Review your demo link, GitHub repo, and project summary.",
    meta: "Before judging",
    icon: Trophy,
  },
] as const;

const faqItems = [
  {
    question: "Where should I ask questions during the event?",
    answer:
      "Use Discord for quick questions, then go to the organizer desk if you need in-person help.",
  },
  {
    question: "What should be ready before judging?",
    answer:
      "Make sure your project name, description, team members, GitHub repo, demo links, and award categories are submitted.",
  },
  {
    question: "How do judging times work?",
    answer:
      "Your judging slot appears on the Projects page once schedule_slots has been assigned for your project.",
  },
  {
    question: "Where can I find food and room information?",
    answer:
      "Use the Food and Location pages for menus, allergens, room markers, and workspace details.",
  },
] as const;

const announcements = [
  "Keep your Discord notifications on for live schedule changes.",
  "Submit project links before judging starts so judges can review them.",
  "Use the mentor queue early if you are blocked on setup or deployment.",
] as const;

function ActionCard({
  title,
  description,
  href,
  icon: Icon,
}: (typeof dashboardActions)[number]) {
  return (
    <Link
      href={href}
      className="group rounded-lg border border-primary/10 bg-white p-4 shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/[0.03]"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-black text-neutral-950">{title}</h3>
            <ArrowRight
              className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
              aria-hidden="true"
            />
          </div>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default function HackerPage() {
  return (
    <main className="h-full w-full overflow-auto overscroll-none bg-white p-4 text-neutral-950 sm:p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="rounded-lg bg-primary px-5 py-6 text-primary-foreground shadow-sm sm:px-7">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-end">
            <div>
              <Badge
                variant="secondary"
                className="mb-4 bg-white/15 text-primary-foreground"
              >
                Hacker portal
              </Badge>
              <h1 className="text-3xl font-black sm:text-4xl">
                Dashboard
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-primary-foreground/85 sm:text-base">
                Quick access to event logistics, help channels, project
                submission, judging details, and community links.
              </p>
            </div>

            <div className="rounded-md bg-white/12 p-4">
              <p className="text-sm font-bold">Project status</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="flex items-center gap-2 text-sm text-primary-foreground/85">
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                  Submit details before judging.
                </div>
                <div className="flex items-center gap-2 text-sm text-primary-foreground/85">
                  <CalendarClock className="size-4" aria-hidden="true" />
                  Check your assigned slot.
                </div>
              </div>
              <Button asChild variant="secondary" className="mt-4 font-bold">
                <Link href="/hacker/submission">
                  <Send className="size-4" aria-hidden="true" />
                  Open submission
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="rounded-lg border-primary/10 bg-white shadow-sm">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <BookOpen className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black">
                    Start Here
                  </CardTitle>
                  <CardDescription>
                    The routes hackers are most likely to need during the event.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {dashboardActions.map((action) => (
                  <ActionCard key={action.href} {...action} />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border-primary/10 bg-white shadow-sm">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <MessageCircle className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black">
                    Community
                  </CardTitle>
                  <CardDescription>
                    Links for updates, photos, and follow-up.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3">
              {communityLinks.map(({ label, description, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="group rounded-lg border border-primary/10 p-3 transition-colors hover:border-primary/30 hover:bg-primary/[0.03]"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="size-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-neutral-950">{label}</p>
                        <ExternalLink
                          className="size-4 shrink-0 text-muted-foreground group-hover:text-primary"
                          aria-hidden="true"
                        />
                      </div>
                      <p className="mt-1 text-sm leading-5 text-muted-foreground">
                        {description}
                      </p>
                    </div>
                  </div>
                </a>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
          <Card className="rounded-lg border-primary/10 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-black">Live Notes</CardTitle>
              <CardDescription>
                Things worth keeping visible while hacking.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {announcements.map((announcement) => (
                <div key={announcement} className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                  </div>
                  <p className="text-sm leading-5 text-neutral-700">
                    {announcement}
                  </p>
                </div>
              ))}
              <Separator />
              <Button asChild className="w-full font-bold">
                <Link href="/hacker/projects">
                  <Trophy className="size-4" aria-hidden="true" />
                  View judging info
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-lg border-primary/10 bg-white shadow-sm">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <LifeBuoy className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black">
                    Mentors & Help
                  </CardTitle>
                  <CardDescription>
                    Where to go when you need technical or event support.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              {helpChannels.map(({ title, description, meta, icon: Icon }) => (
                <div
                  key={title}
                  className="rounded-lg border border-primary/10 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="size-4" aria-hidden="true" />
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-primary/5 text-primary"
                    >
                      {meta}
                    </Badge>
                  </div>
                  <h3 className="mt-4 text-base font-black text-neutral-950">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-5 text-muted-foreground">
                    {description}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <Card id="faq" className="rounded-lg border-primary/10 bg-white shadow-sm">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <HelpCircle className="size-5" aria-hidden="true" />
              </div>
              <div>
                <CardTitle className="text-xl font-black">FAQ</CardTitle>
                <CardDescription>
                  Common answers for submission, judging, rooms, and support.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {faqItems.map((item) => (
                <div
                  key={item.question}
                  className="rounded-lg border border-primary/10 bg-primary/[0.02] p-4"
                >
                  <h3 className="font-black text-neutral-950">
                    {item.question}
                  </h3>
                  <p className="mt-2 text-sm leading-5 text-muted-foreground">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

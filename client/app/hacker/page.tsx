import {
  ArrowUpRight,
  CalendarDays,
  FolderKanban,
  MessageCircle,
  Send,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import beaverPortrait from "./assets/IMG_0121 1.png";
import { StickerDock } from "./StickerShelf";

type ImportantLink = {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  external?: boolean;
};

const importantLinks: ImportantLink[] = [
  {
    label: "Event schedule",
    description: "See what is happening and when.",
    href: "/hacker/schedule",
    icon: CalendarDays,
  },
  {
    label: "Project submission",
    description: "Add or update your team’s project.",
    href: "/hacker/submission",
    icon: Send,
  },
  {
    label: "Discord",
    description: "Get announcements and organizer support.",
    href: "https://discord.gg/hackcanada",
    icon: MessageCircle,
    external: true,
  },
  {
    label: "Project gallery",
    description: "See what everyone is building.",
    href: "/hacker/projects",
    icon: FolderKanban,
  },
];

const frequentlyAskedQuestions = [
  {
    question: "What needs to be in my project submission?",
    answer:
      "Include your project name, team members, a short description, and the links you have ready—such as GitHub, Devpost, a demo, or a video.",
  },
  {
    question: "Where will schedule changes be posted?",
    answer:
      "The schedule page is your source of truth. Time-sensitive updates will also be shared in the HackCanada Discord.",
  },
  {
    question: "Where do I go for judging?",
    answer:
      "Check the schedule for your judging time and room. Give yourself a few minutes to arrive and set up before your slot.",
  },
  {
    question: "What if I need help during the event?",
    answer:
      "Ask in Discord for a quick answer or speak with an organizer in person. For project-specific questions, bring your team name and submission details.",
  },
] as const;

export default function HackerPage() {
  return (
    <main className="h-full w-full overflow-y-auto overscroll-none bg-transparent text-[var(--text-body)]">
      <div
        data-sticker-content
        className="relative mx-auto flex w-full max-w-[1180px] flex-col gap-5 overflow-clip px-4 pb-12 pt-5 sm:gap-6 sm:px-6 sm:py-7 xl:px-8 xl:py-8"
      >
        <section
          className="hacker-card-enter relative isolate overflow-hidden rounded-[1.75rem] border border-[color:var(--bg-gray-dark)]/65 bg-[var(--bg-white)]"
          style={{ animationDelay: "40ms" }}
        >
          <div
            aria-hidden="true"
            className="absolute -left-10 -top-12 size-40 rounded-full border-[22px] border-[color:var(--bg-primary-light)]/70"
          />
          <div
            aria-hidden="true"
            className="absolute bottom-7 left-[46%] size-3 rotate-12 rounded-[3px] bg-[var(--brand-accent)]"
          />

          <div className="grid min-h-[350px] lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
            <div className="relative z-10 flex flex-col justify-center px-6 py-10 sm:px-9 lg:px-11 lg:py-12">
              <h1 className="max-w-[640px] [font-family:var(--font-fredoka)] text-[clamp(2.5rem,6vw,4.7rem)] font-semibold leading-[0.96] tracking-[-0.045em] text-[var(--brand-secondary)]">
                Welcome back,
                <br />
                <span className="[font-family:var(--font-fredoka)]">
                  hacker.
                </span>
              </h1>
              <div className="mt-7 flex flex-wrap gap-3 [font-family:var(--font-figtree)]">
                <Link
                  href="/hacker/schedule"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--brand-secondary)] px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]"
                >
                  View schedule
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/hacker/submission"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[color:var(--brand-secondary)]/16 bg-white/65 px-5 py-2.5 text-sm font-semibold text-[var(--brand-secondary)] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]"
                >
                  Submit project
                </Link>
              </div>
            </div>

            <div
              className="relative min-h-[290px] overflow-hidden bg-[var(--bg-white)] lg:min-h-full"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 50% 52%, rgba(220,235,251,0.72), rgba(255,255,255,0) 58%)",
              }}
            >
              <div className="relative flex h-full min-h-[290px] items-end justify-center overflow-hidden px-8 pt-8 lg:min-h-[350px]">
                <div
                  aria-hidden="true"
                  className="absolute left-[12%] top-[18%] h-16 w-28 -rotate-6 rounded-full bg-white/65"
                />
                <div
                  aria-hidden="true"
                  className="absolute right-[10%] top-[13%] size-9 rounded-full bg-[var(--bg-warning)]"
                />
                <Image
                  src={beaverPortrait}
                  alt="HackCanada beaver mascot"
                  priority
                  className="relative z-10 h-auto max-h-[330px] w-auto max-w-[88%] object-contain drop-shadow-[0_22px_24px_rgba(15,42,67,0.16)]"
                  sizes="(max-width: 1024px) 60vw, 380px"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-2 lg:items-stretch">
          <section
            aria-labelledby="important-links-title"
            className="hacker-card-enter flex min-h-[390px] flex-col rounded-[1.75rem] border border-[color:var(--bg-gray-dark)]/65 bg-[var(--bg-white)] p-5 sm:p-7 lg:h-full"
            style={{ animationDelay: "120ms" }}
          >
            <h2
              id="important-links-title"
              className="[font-family:var(--font-fredoka)] text-2xl font-semibold tracking-[-0.02em] text-[var(--brand-secondary)] sm:text-3xl"
            >
              Important links
            </h2>
            <div className="mt-5 flex-1 divide-y divide-[var(--bg-gray)]">
              {importantLinks.map(
                ({ label, description, href, icon: Icon, external }) => (
                  <Link
                    key={label}
                    href={href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noreferrer" : undefined}
                    className="group flex items-center gap-3 py-3.5 first:pt-0 last:pb-0 focus-visible:rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-primary)]"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-primary-light)] text-[var(--text-primary)] transition-colors group-hover:bg-[var(--brand-primary)] group-hover:text-white">
                      <Icon className="size-[18px]" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block [font-family:var(--font-figtree)] text-sm font-bold text-[var(--brand-secondary)] sm:text-[15px]">
                        {label}
                      </span>
                      <span className="mt-0.5 block [font-family:var(--font-figtree)] text-xs leading-5 text-[var(--text-secondary)] sm:text-sm">
                        {description}
                      </span>
                    </span>
                    <ArrowUpRight
                      className="size-4 shrink-0 text-[var(--text-tertiary)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--text-primary)]"
                      aria-hidden="true"
                    />
                  </Link>
                ),
              )}
            </div>
          </section>

          <section
            aria-labelledby="faq-title"
            className="hacker-card-enter flex min-h-[390px] flex-col rounded-[1.75rem] border border-[color:var(--bg-gray-dark)]/65 bg-[var(--bg-white)] p-5 sm:p-7 lg:h-full"
            style={{ animationDelay: "190ms" }}
          >
            <h2
              id="faq-title"
              className="[font-family:var(--font-fredoka)] text-2xl font-semibold tracking-[-0.02em] text-[var(--brand-secondary)] sm:text-3xl"
            >
              Frequently asked questions
            </h2>
            <Accordion
              type="single"
              collapsible
              className="mt-4 flex-1 border-t border-[var(--bg-gray)]"
            >
              {frequentlyAskedQuestions.map(({ question, answer }, index) => (
                <AccordionItem
                  key={question}
                  value={`faq-${index + 1}`}
                  className="border-[var(--bg-gray)]"
                >
                  <AccordionTrigger className="gap-4 py-4 [font-family:var(--font-figtree)] text-[15px] font-bold leading-6 text-[var(--brand-secondary)] hover:no-underline">
                    {question}
                  </AccordionTrigger>
                  <AccordionContent className="pr-8 [font-family:var(--font-figtree)] text-sm leading-6 text-[var(--text-secondary)]">
                    <p>{answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        </div>

        <StickerDock />
      </div>
    </main>
  );
}

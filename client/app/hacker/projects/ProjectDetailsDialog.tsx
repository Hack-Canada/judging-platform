"use client";

import {
  ArrowUpRight,
  CalendarClock,
  Clock3,
  ExternalLink,
  Github,
  MapPin,
  Users,
  Youtube,
} from "lucide-react";

import { SpotlightCard } from "@/components/SpotlightCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  memberLabel,
  projectDescription,
  projectLinks,
  projectTechStack,
  submittedLabel,
  type ProjectTableRow,
} from "./project-display";

type ProjectDetailsDialogProps = {
  selectedRow: ProjectTableRow | null;
  onOpenChange: (open: boolean) => void;
};

function ExternalProjectLink({
  href,
  icon: Icon,
  label,
}: {
  href: string | null;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  if (!href) return null;

  return (
    <Button
      asChild
      variant="outline"
      className="h-10 rounded-full border-[color:var(--bg-gray-dark)] bg-white px-4 [font-family:var(--font-figtree)] text-sm font-bold text-[var(--brand-secondary)] shadow-none hover:border-[var(--brand-primary)] hover:bg-[var(--bg-primary-light)] hover:text-[var(--brand-secondary)]"
    >
      <a href={href} target="_blank" rel="noreferrer">
        <Icon aria-hidden="true" className="size-4" />
        {label}
        <ArrowUpRight aria-hidden="true" className="size-3.5" />
      </a>
    </Button>
  );
}

export function ProjectDetailsDialog({
  selectedRow,
  onOpenChange,
}: ProjectDetailsDialogProps) {
  const project = selectedRow?.project ?? null;
  const slot = selectedRow?.slot ?? null;
  const links = project ? projectLinks(project) : null;
  const techStack = project ? projectTechStack(project) : null;

  return (
    <Dialog open={Boolean(selectedRow)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] gap-0 overflow-hidden rounded-[2rem] border-0 bg-transparent p-0 ring-0 sm:max-w-2xl">
        {project ? (
          <SpotlightCard className="max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-[2rem] border border-[color:var(--bg-gray-dark)]/70 bg-[var(--bg-white)] shadow-[0_28px_80px_rgba(15,42,67,0.24)]">
            <div className="relative overflow-hidden border-b border-[var(--bg-gray)] px-6 pb-6 pt-7 sm:px-8 sm:pb-7 sm:pt-8">
              <div
                aria-hidden="true"
                className="absolute -right-10 -top-14 size-40 rounded-full border-[22px] border-[color:var(--bg-primary-light)]/70"
              />

              <DialogHeader className="relative pr-10">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="rounded-full bg-[var(--bg-primary-light)] px-3 py-1 [font-family:var(--font-jetbrains-mono)] text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-primary)] shadow-none">
                    Project details
                  </Badge>
                  {slot ? (
                    <Badge
                      variant="outline"
                      className="rounded-full border-[color:var(--brand-accent)]/35 bg-[var(--bg-success-light)] px-3 py-1 [font-family:var(--font-figtree)] text-xs font-bold text-[var(--text-success)]"
                    >
                      {slot.status}
                    </Badge>
                  ) : null}
                </div>
                <DialogTitle className="mt-3 [font-family:var(--font-fredoka)] text-3xl font-semibold leading-tight tracking-[-0.035em] text-[var(--brand-secondary)] sm:text-4xl">
                  {project.project_name}
                </DialogTitle>
                <DialogDescription className="[font-family:var(--font-figtree)] text-sm text-[var(--text-secondary)]">
                  {memberLabel(project)}
                </DialogDescription>
              </DialogHeader>

              <div className="relative mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-[var(--brand-secondary)] p-4 text-white">
                  <div className="flex items-center gap-2 text-white/70">
                    <MapPin aria-hidden="true" className="size-4" />
                    <p className="[font-family:var(--font-jetbrains-mono)] text-[10px] font-semibold uppercase tracking-[0.1em]">
                      Judging area
                    </p>
                  </div>
                  <p className="mt-3 [font-family:var(--font-fredoka)] text-2xl font-semibold">
                    {slot?.room ?? "Not assigned"}
                  </p>
                  <p className="mt-1 [font-family:var(--font-figtree)] text-xs text-white/70">
                    {slot?.roomLocation ?? "Room location will appear here."}
                  </p>
                </div>

                <div className="rounded-2xl border border-[color:var(--bg-gray-dark)]/70 bg-[var(--bg-light)] p-4">
                  <div className="flex items-center gap-2 text-[var(--text-primary)]">
                    <CalendarClock aria-hidden="true" className="size-4" />
                    <p className="[font-family:var(--font-jetbrains-mono)] text-[10px] font-semibold uppercase tracking-[0.1em]">
                      Presentation
                    </p>
                  </div>
                  <p className="mt-3 [font-family:var(--font-fredoka)] text-2xl font-semibold text-[var(--brand-secondary)]">
                    {slot?.time ?? "TBD"}
                  </p>
                  <p className="mt-1 [font-family:var(--font-figtree)] text-xs text-[var(--text-secondary)]">
                    {slot
                      ? `${slot.durationMinutes} minutes${slot.track ? ` · ${slot.track}` : ""}`
                      : "A presentation time has not been assigned."}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-7 px-6 py-7 sm:px-8 sm:py-8">
              <section>
                <p className="[font-family:var(--font-jetbrains-mono)] text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)]">
                  About the project
                </p>
                <p className="mt-2 whitespace-pre-wrap [font-family:var(--font-figtree)] text-sm leading-7 text-[var(--text-body)] sm:text-base">
                  {projectDescription(project)}
                </p>
              </section>

              <div className="grid gap-4 sm:grid-cols-2">
                <section className="rounded-2xl border border-[color:var(--bg-gray-dark)]/65 bg-[var(--bg-light)] p-4">
                  <div className="flex items-center gap-2 text-[var(--text-primary)]">
                    <Users aria-hidden="true" className="size-4" />
                    <h3 className="[font-family:var(--font-jetbrains-mono)] text-[10px] font-semibold uppercase tracking-[0.1em]">
                      People
                    </h3>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap [font-family:var(--font-figtree)] text-sm leading-6 text-[var(--brand-secondary)]">
                    {memberLabel(project)}
                  </p>
                </section>

                <section className="rounded-2xl border border-[color:var(--bg-gray-dark)]/65 bg-[var(--bg-light)] p-4">
                  <div className="flex items-center gap-2 text-[var(--text-primary)]">
                    <Clock3 aria-hidden="true" className="size-4" />
                    <h3 className="[font-family:var(--font-jetbrains-mono)] text-[10px] font-semibold uppercase tracking-[0.1em]">
                      Submitted
                    </h3>
                  </div>
                  <p className="mt-3 [font-family:var(--font-figtree)] text-sm leading-6 text-[var(--brand-secondary)]">
                    {submittedLabel(
                      project.submitted_at ?? project.created_at,
                    )}
                  </p>
                </section>

                {techStack ? (
                  <section className="rounded-2xl border border-[color:var(--bg-gray-dark)]/65 bg-[var(--bg-light)] p-4 sm:col-span-2">
                    <p className="[font-family:var(--font-jetbrains-mono)] text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-primary)]">
                      Tech stack
                    </p>
                    <p className="mt-3 [font-family:var(--font-figtree)] text-sm leading-6 text-[var(--brand-secondary)]">
                      {techStack}
                    </p>
                  </section>
                ) : null}
              </div>

              {project.tracks.length > 0 ? (
                <section>
                  <p className="[font-family:var(--font-jetbrains-mono)] text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
                    Tracks
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {project.tracks.map((track) => (
                      <span
                        key={track}
                        className="rounded-full bg-[var(--bg-primary-light)] px-3 py-1.5 [font-family:var(--font-figtree)] text-xs font-bold text-[var(--brand-secondary)]"
                      >
                        {track}
                      </span>
                    ))}
                  </div>
                </section>
              ) : null}

              {links &&
              (links.github ||
                links.demo ||
                links.youtube ||
                links.devpost) ? (
                <section className="border-t border-[var(--bg-gray)] pt-6">
                  <p className="[font-family:var(--font-jetbrains-mono)] text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
                    Project links
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <ExternalProjectLink
                      href={links.github}
                      icon={Github}
                      label="GitHub"
                    />
                    <ExternalProjectLink
                      href={links.demo}
                      icon={ExternalLink}
                      label="Live demo"
                    />
                    <ExternalProjectLink
                      href={links.youtube}
                      icon={Youtube}
                      label="Video"
                    />
                    <ExternalProjectLink
                      href={links.devpost}
                      icon={ExternalLink}
                      label="Devpost"
                    />
                  </div>
                </section>
              ) : null}
            </div>
          </SpotlightCard>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

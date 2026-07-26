import {
  Clock3,
  Ellipsis,
  Github,
  Users,
} from "lucide-react";
import type { KeyboardEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import {
  initials,
  memberLabel,
  projectDescription,
  projectLinks,
  type ProjectTableRow,
} from "./project-display";

type ProjectTableProps = {
  rows: ProjectTableRow[];
  onOpenProject: (row: ProjectTableRow) => void;
  embedded?: boolean;
};

function openRowWithKeyboard(
  event: KeyboardEvent<HTMLTableRowElement>,
  row: ProjectTableRow,
  onOpenProject: (row: ProjectTableRow) => void,
) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  onOpenProject(row);
}

export function ProjectTable({
  rows,
  onOpenProject,
  embedded = false,
}: ProjectTableProps) {
  return (
    <div
      className={cn(
        "overflow-hidden bg-[var(--bg-white)]",
        !embedded &&
          "rounded-[1.75rem] border border-[color:var(--bg-gray-dark)]/65 shadow-[0_10px_24px_rgba(15,42,67,0.06)]",
      )}
    >
      <p className="border-b border-[var(--bg-gray)] bg-[var(--bg-light)] px-4 py-2.5 [font-family:var(--font-figtree)] text-xs font-semibold text-[var(--text-secondary)] sm:hidden">
        Swipe to see description, people, presentation, and links →
      </p>
      <Table className="min-w-[980px] [font-family:var(--font-figtree)]">
        <TableHeader className="bg-[var(--bg-light)]">
          <TableRow className="border-[var(--bg-gray)] hover:bg-transparent">
            <TableHead className="w-[230px] px-5 [font-family:var(--font-jetbrains-mono)] text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
              Project
            </TableHead>
            <TableHead className="w-[300px] px-4 [font-family:var(--font-jetbrains-mono)] text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
              Description
            </TableHead>
            <TableHead className="w-[190px] px-4 [font-family:var(--font-jetbrains-mono)] text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
              People
            </TableHead>
            <TableHead className="w-[190px] px-4 [font-family:var(--font-jetbrains-mono)] text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
              Presentation
            </TableHead>
            <TableHead className="w-[120px] px-4 [font-family:var(--font-jetbrains-mono)] text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
              GitHub
            </TableHead>
            <TableHead className="w-14 px-3">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.map((row) => {
            const links = projectLinks(row.project);

            return (
              <TableRow
                key={row.id}
                tabIndex={0}
                onClick={() => onOpenProject(row)}
                onKeyDown={(event) =>
                  openRowWithKeyboard(event, row, onOpenProject)
                }
                className="group cursor-pointer border-[var(--bg-gray)] outline-none hover:bg-[var(--bg-primary-light)]/40 focus-visible:bg-[var(--bg-primary-light)]/55"
              >
                <TableCell className="px-5 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-primary-light)] text-xs font-black text-[var(--text-primary)]">
                      {initials(row.project.project_name) || "P"}
                    </span>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenProject(row);
                      }}
                      className="min-w-0 truncate text-left font-bold text-[var(--brand-secondary)] hover:text-[var(--text-primary)]"
                    >
                      {row.project.project_name}
                    </button>
                  </div>
                </TableCell>

                <TableCell className="whitespace-normal px-4 py-4">
                  <p className="line-clamp-2 max-w-[300px] text-sm leading-5 text-[var(--text-secondary)]">
                    {projectDescription(row.project)}
                  </p>
                </TableCell>

                <TableCell className="px-4 py-4">
                  <div className="flex max-w-[190px] items-center gap-2 text-sm text-[var(--text-body)]">
                    <Users
                      aria-hidden="true"
                      className="size-4 shrink-0 text-[var(--brand-accent)]"
                    />
                    <span className="truncate">
                      {memberLabel(row.project)}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="px-4 py-4">
                  {row.slot ? (
                    <div className="flex items-start gap-2">
                      <Clock3
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-[var(--text-primary)]"
                      />
                      <div>
                        <p className="text-sm font-bold text-[var(--brand-secondary)]">
                          {row.slot.time}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                          {row.slot.room}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <span className="inline-flex rounded-full bg-[var(--bg-gray)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                      Not scheduled
                    </span>
                  )}
                </TableCell>

                <TableCell className="px-4 py-4">
                  {links.github ? (
                    <a
                      href={links.github}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => event.stopPropagation()}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--bg-gray-dark)] bg-white px-3 py-1.5 text-xs font-bold text-[var(--brand-secondary)] transition-colors hover:border-[var(--brand-primary)] hover:text-[var(--text-primary)]"
                    >
                      <Github aria-hidden="true" className="size-3.5" />
                      Open
                    </a>
                  ) : (
                    <span className="text-xs text-[var(--text-tertiary)]">
                      Not added
                    </span>
                  )}
                </TableCell>

                <TableCell className="px-3 py-4">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenProject(row);
                    }}
                    aria-label={`Open details for ${row.project.project_name}`}
                    className="rounded-full text-[var(--text-secondary)] hover:bg-white hover:text-[var(--brand-secondary)]"
                  >
                    <Ellipsis aria-hidden="true" className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

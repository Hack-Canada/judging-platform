import {
  CheckCircle2,
  Code2,
  FileText,
  Github,
  Info,
  LinkIcon,
  Send,
  Trophy,
  Youtube,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

const linkFields = [
  {
    id: "githubLink",
    label: "GitHub Repository",
    placeholder: "https://github.com/team/project",
    icon: Github,
    required: true,
  },
  {
    id: "devpostLink",
    label: "Devpost URL",
    placeholder: "https://devpost.com/software/project",
    icon: LinkIcon,
    required: false,
  },
  {
    id: "demoLink",
    label: "Live Demo URL",
    placeholder: "https://project-demo.com",
    icon: LinkIcon,
    required: false,
  },
  {
    id: "youtubeLink",
    label: "YouTube Demo",
    placeholder: "https://youtube.com/watch?v=...",
    icon: Youtube,
    required: false,
  },
] as const;

const categoryOptions = [
  "AI",
  "Web",
  "Design",
  "Social Impact",
  "Beginner",
] as const;

function RequiredMark() {
  return <span className="text-primary">*</span>;
}

function SectionTitle({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <CardHeader className="border-b border-primary/10 bg-primary/5 p-6">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <div>
          <CardTitle className="text-xl font-bold text-neutral-950">
            {title}
          </CardTitle>
          <CardDescription className="mt-1">{description}</CardDescription>
        </div>
      </div>
    </CardHeader>
  );
}

function FormField({
  id,
  label,
  required,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-sm font-semibold text-neutral-900">
        {label} {required ? <RequiredMark /> : null}
      </Label>
      {children}
    </div>
  );
}

export default function SubmissionPage() {
  return (
    <main className="h-full w-full overflow-auto overscroll-none bg-white p-4 text-neutral-950 sm:p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="rounded-lg bg-primary px-5 py-6 text-primary-foreground shadow-sm sm:px-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Badge
                variant="secondary"
                className="mb-4 bg-white/15 text-primary-foreground"
              >
                Project submission
              </Badge>
              <h1 className="text-3xl font-black sm:text-4xl">
                Submit Your Hackathon Project
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-primary-foreground/85 sm:text-base">
                Finalize project details, team members, links, and award
                categories before judging begins.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-md bg-white/12 px-3 py-2">
                <p className="font-bold">Required</p>
                <p className="text-primary-foreground/80">Project, GitHub</p>
              </div>
              <div className="rounded-md bg-white/12 px-3 py-2">
                <p className="font-bold">Optional</p>
                <p className="text-primary-foreground/80">Demo, YouTube</p>
              </div>
              <div className="rounded-md bg-white/12 px-3 py-2">
                <p className="font-bold">Status</p>
                <p className="text-primary-foreground/80">Draft</p>
              </div>
            </div>
          </div>
        </header>

        <form className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="flex min-w-0 flex-col gap-6">
            <Card className="gap-0 overflow-hidden rounded-lg border-primary/10 bg-white py-0 shadow-sm">
              <SectionTitle
                icon={Info}
                title="Basic Information"
                description="Core details judges need before opening your project."
              />
              <CardContent className="grid gap-5 p-6">
                <FormField id="projectName" label="Project Name" required>
                  <Input
                    id="projectName"
                    name="projectName"
                    required
                    placeholder="e.g., Campus Compass"
                    className="h-11 bg-white"
                  />
                </FormField>

                <FormField id="tagline" label="Elevator Pitch (Tagline)">
                  <Input
                    id="tagline"
                    name="tagline"
                    placeholder="One clear sentence about what your project does."
                    className="h-11 bg-white"
                  />
                </FormField>

                <FormField id="description" label="Full Description" required>
                  <Textarea
                    id="description"
                    name="description"
                    required
                    rows={7}
                    placeholder="Explain the problem, your solution, key features, and what your team built during the hackathon."
                    className="min-h-44 resize-y bg-white"
                  />
                </FormField>

                <FormField id="builtWith" label="Built With" required>
                  <Input
                    id="builtWith"
                    name="builtWith"
                    required
                    placeholder="React, Next.js, Neon, Python, OpenAI..."
                    className="h-11 bg-white"
                  />
                </FormField>

                <FormField id="teamMembers" label="Team Members">
                  <Textarea
                    id="teamMembers"
                    name="teamMembers"
                    rows={4}
                    placeholder="List each team member on a new line."
                    className="min-h-28 resize-y bg-white"
                  />
                </FormField>
              </CardContent>
            </Card>

            <Card className="gap-0 overflow-hidden rounded-lg border-primary/10 bg-white py-0 shadow-sm">
              <SectionTitle
                icon={LinkIcon}
                title="Important Links"
                description="GitHub is required; demos and videos help judges review faster."
              />
              <CardContent className="grid gap-5 p-6 md:grid-cols-2">
                {linkFields.map(({ id, label, placeholder, icon: Icon, required }) => (
                  <FormField
                    key={id}
                    id={id}
                    label={label}
                    required={required}
                  >
                    <div className="relative">
                      <Icon
                        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary"
                        aria-hidden="true"
                      />
                      <Input
                        id={id}
                        name={id}
                        type="url"
                        required={required}
                        placeholder={placeholder}
                        className="h-11 bg-white pl-9"
                      />
                    </div>
                  </FormField>
                ))}
              </CardContent>
            </Card>
          </div>

          <aside className="flex min-w-0 flex-col gap-6">
            <Card className="gap-0 overflow-hidden rounded-lg border-primary/10 bg-white py-0 shadow-sm">
              <CardHeader className="p-6">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <Trophy className="size-5" aria-hidden="true" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">
                      Award Categories
                    </CardTitle>
                    <CardDescription>Project-level judging tracks.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2 px-6 pb-6">
                {categoryOptions.map((category) => (
                  <Label
                    key={category}
                    htmlFor={`project-${category}`}
                    className="flex h-9 cursor-pointer items-center gap-2 rounded-md border border-primary/15 bg-primary/5 px-3 text-sm font-semibold"
                  >
                    <Checkbox
                      id={`project-${category}`}
                      name="projectCategories"
                      value={category}
                    />
                    {category}
                  </Label>
                ))}
              </CardContent>
            </Card>

            <Card className="gap-0 overflow-hidden rounded-lg border-primary/10 bg-white py-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    className="mt-0.5 size-5 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-semibold text-neutral-950">
                      Submission checklist
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-neutral-600">
                      <li className="flex gap-2">
                        <Code2 className="mt-0.5 size-4 text-primary" />
                        GitHub repository is public or shared.
                      </li>
                      <li className="flex gap-2">
                        <FileText className="mt-0.5 size-4 text-primary" />
                        Description explains what changed during the hackathon.
                      </li>
                    </ul>
                  </div>
                </div>

                <Separator className="my-5" />

                <Button type="submit" className="h-12 w-full text-base font-bold">
                  <Send className="size-4" aria-hidden="true" />
                  Submit Project
                </Button>
              </CardContent>
            </Card>
          </aside>
        </form>
      </div>
    </main>
  );
}

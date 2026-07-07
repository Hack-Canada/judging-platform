import {
  CloudUpload,
  Github,
  ImageIcon,
  Info,
  LinkIcon,
  Send,
  UserPlus,
  Users,
  Video,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const linkFields = [
  {
    id: "githubLink",
    label: "GitHub Repository",
    placeholder: "https://github.com/...",
    icon: Github,
  },
  {
    id: "devpostLink",
    label: "Devpost URL",
    placeholder: "https://devpost.com/...",
    icon: LinkIcon,
  },
  {
    id: "demoLink",
    label: "Live Demo URL",
    placeholder: "https://...",
    icon: LinkIcon,
  },
  {
    id: "videoLink",
    label: "Video Demo URL",
    placeholder: "YouTube, Vimeo, etc.",
    icon: Video,
  },
] as const;

const roles = [
  "Lead Developer",
  "Frontend Developer",
  "Backend Developer",
  "Designer",
  "Project Manager",
] as const;

function SectionHeading({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <h2 className="mb-5 flex items-center gap-2 text-xl font-semibold text-neutral-950">
      <Icon className="size-5 text-primary-color" aria-hidden="true" />
      {children}
    </h2>
  );
}

function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-sm font-semibold text-neutral-900"
    >
      {children}
      {required ? <span className="text-primary-color"> *</span> : null}
    </label>
  );
}

export default function SubmissionPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fb] px-4 py-8 text-neutral-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="max-w-3xl">
          <h1 className="text-3xl font-bold text-neutral-950 sm:text-4xl">
            Submit Your Project
          </h1>
          <p className="mt-2 text-base text-neutral-600 sm:text-lg">
            Finalize your submission before the deadline.
          </p>
        </header>

        <form className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="flex flex-col gap-6 lg:col-span-8">
            <section className="rounded-lg border border-neutral-200 bg-white/90 p-6 shadow-sm">
              <SectionHeading icon={Info}>Basic Information</SectionHeading>

              <div className="flex flex-col gap-5">
                <div>
                  <FieldLabel htmlFor="projectName" required>
                    Project Name
                  </FieldLabel>
                  <Input
                    id="projectName"
                    name="projectName"
                    required
                    placeholder="e.g., Quantum Compiler"
                    className="h-11 bg-white text-base"
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="tagline">
                    Elevator Pitch (Tagline)
                  </FieldLabel>
                  <Input
                    id="tagline"
                    name="tagline"
                    placeholder="One sentence describing what it does."
                    className="h-11 bg-white text-base"
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="description" required>
                    Full Description
                  </FieldLabel>
                  <Textarea
                    id="description"
                    name="description"
                    required
                    rows={6}
                    placeholder="Describe the problem, your solution, and how you built it..."
                    className="min-h-36 resize-y bg-white text-base"
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="builtWith" required>
                    Built With
                  </FieldLabel>
                  <Input
                    id="builtWith"
                    name="builtWith"
                    required
                    placeholder="e.g., React, Node.js, TensorFlow"
                    className="h-11 bg-white text-base"
                  />
                  <p className="mt-1 text-sm text-neutral-500">
                    List the languages, frameworks, and tools used.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-neutral-200 bg-white/90 p-6 shadow-sm">
              <SectionHeading icon={LinkIcon}>Important Links</SectionHeading>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {linkFields.map(({ id, label, placeholder, icon: Icon }) => (
                  <div key={id}>
                    <FieldLabel htmlFor={id}>
                      <Icon
                        className="inline size-4 text-neutral-500"
                        aria-hidden="true"
                      />
                      <span className="ml-2">{label}</span>
                    </FieldLabel>
                    <Input
                      id={id}
                      name={id}
                      type="url"
                      placeholder={placeholder}
                      className="h-11 bg-white text-base"
                    />
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="flex flex-col gap-6 lg:col-span-4">
            <section className="rounded-lg border border-neutral-200 bg-white/90 p-6 shadow-sm">
              <SectionHeading icon={Users}>Team Members</SectionHeading>

              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-primary-color ring-1 ring-neutral-200">
                    JD
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-950">
                      John Doe (You)
                    </p>
                    <p className="text-sm text-neutral-500">Project member</p>
                  </div>
                </div>

                <label htmlFor="memberRole" className="sr-only">
                  Team member role
                </label>
                <select
                  id="memberRole"
                  name="memberRole"
                  defaultValue="Frontend Developer"
                  className="mt-4 h-10 w-full rounded-md border border-input bg-white px-3 text-sm shadow-xs outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                type="button"
                variant="outline"
                className="mt-4 w-full text-primary-color"
              >
                <UserPlus className="size-4" aria-hidden="true" />
                Invite Collaborator
              </Button>
            </section>

            <section className="rounded-lg border border-neutral-200 bg-white/90 p-6 shadow-sm">
              <SectionHeading icon={ImageIcon}>Cover Image</SectionHeading>

              <label
                htmlFor="coverImage"
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 px-6 py-10 text-center transition-colors hover:border-primary-color hover:bg-red-50/40"
              >
                <CloudUpload
                  className="mb-3 size-10 text-neutral-500"
                  aria-hidden="true"
                />
                <span className="font-semibold text-neutral-950">
                  Drag and drop or click to upload
                </span>
                <span className="mt-1 text-sm text-neutral-500">
                  16:9 ratio recommended
                </span>
                <input
                  id="coverImage"
                  name="coverImage"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                />
              </label>
            </section>

            <section className="rounded-lg border border-neutral-200 bg-white/90 p-6 shadow-sm">
              <Button
                type="submit"
                className="h-12 w-full bg-primary-color text-base font-semibold text-white shadow-sm hover:bg-red-700"
              >
                <Send className="size-4" aria-hidden="true" />
                Submit Project
              </Button>
              <p className="mt-3 text-center text-sm text-neutral-500">
                By submitting, you agree to the hackathon rules.
              </p>
            </section>
          </aside>
        </form>
      </div>
    </main>
  );
}

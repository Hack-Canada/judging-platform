"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  ContactRound,
  FileText,
  Github,
  Lightbulb,
  Link2,
  ListChecks,
  RefreshCw,
  Rocket,
  Send,
  Users,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import {
  type FormEvent,
  type ReactNode,
  useRef,
  useState,
} from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { submitProject } from "./actions";

type FormValues = {
  projectName: string;
  description: string;
  tagline: string;
  teamMembers: string;
  builtWith: string;
  githubLink: string;
  youtubeLink: string;
  demoLink: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  challengesFaced: string;
  lessonsLearned: string;
  nextSteps: string;
};

type Step = {
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
};

const initialValues: FormValues = {
  projectName: "",
  description: "",
  tagline: "",
  teamMembers: "",
  builtWith: "",
  githubLink: "",
  youtubeLink: "",
  demoLink: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  emergencyContactRelationship: "",
  challengesFaced: "",
  lessonsLearned: "",
  nextSteps: "",
};

const steps: Step[] = [
  {
    label: "Tell us about your project",
    shortLabel: "Project",
    description:
      "Give judges the context they need to understand your hack and your team.",
    icon: FileText,
  },
  {
    label: "Links and emergency contact",
    shortLabel: "Links & contact",
    description:
      "Share the project links judges will use and a contact we can reach if needed.",
    icon: Link2,
  },
  {
    label: "Your build story",
    shortLabel: "Reflection",
    description:
      "Reflect on the challenges, lessons, and direction behind your project.",
    icon: Lightbulb,
  },
  {
    label: "Review and submit",
    shortLabel: "Review",
    description:
      "Take one final look, confirm the details, and send your project to judging.",
    icon: ListChecks,
  },
];

const inputClassName =
  "h-12 rounded-xl border-[color:var(--bg-gray-dark)] bg-[var(--bg-light)] px-4 [font-family:var(--font-figtree)] text-[var(--text-body)] shadow-none placeholder:text-[var(--text-tertiary)] focus-visible:border-[var(--brand-primary)] focus-visible:ring-[color:var(--brand-primary)]/20";

const textareaClassName =
  "min-h-32 resize-y rounded-xl border-[color:var(--bg-gray-dark)] bg-[var(--bg-light)] px-4 py-3 [font-family:var(--font-figtree)] text-[var(--text-body)] shadow-none placeholder:text-[var(--text-tertiary)] focus-visible:border-[var(--brand-primary)] focus-visible:ring-[color:var(--brand-primary)]/20";

function RequiredMark() {
  return (
    <>
      <span aria-hidden="true" className="text-[var(--text-primary)]">
        *
      </span>
      <span className="sr-only">required</span>
    </>
  );
}

function OptionalMark() {
  return (
    <span className="ml-1 [font-family:var(--font-jetbrains-mono)] text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
      Optional
    </span>
  );
}

function FormField({
  id,
  label,
  required,
  hint,
  className,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <Label
        htmlFor={id}
        className="[font-family:var(--font-figtree)] text-sm font-bold text-[var(--brand-secondary)]"
      >
        {label} {required ? <RequiredMark /> : <OptionalMark />}
      </Label>
      <div className="mt-2">{children}</div>
      {hint ? (
        <p
          id={`${id}-hint`}
          className="mt-2 [font-family:var(--font-figtree)] text-xs leading-5 text-[var(--text-secondary)]"
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function FieldIcon({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <Icon
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-[var(--text-primary)]"
      />
      {children}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-12 rounded-full bg-[var(--brand-secondary)] px-6 [font-family:var(--font-figtree)] text-sm font-bold text-white shadow-none transition-transform hover:-translate-y-0.5 hover:bg-[var(--brand-secondary)] disabled:translate-y-0"
    >
      {pending ? "Submitting…" : "Submit project"}
      <Send aria-hidden="true" className="size-4" />
    </Button>
  );
}

function ReviewSection({
  title,
  step,
  onEdit,
  children,
}: {
  title: string;
  step: number;
  onEdit: (step: number) => void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[color:var(--bg-gray-dark)]/70 bg-[var(--bg-light)] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <h3 className="[font-family:var(--font-fredoka)] text-lg font-semibold text-[var(--brand-secondary)]">
          {title}
        </h3>
        <button
          type="button"
          onClick={() => onEdit(step)}
          className="rounded-full border border-[color:var(--brand-secondary)]/15 bg-white px-3 py-1.5 [font-family:var(--font-figtree)] text-xs font-bold text-[var(--brand-secondary)] transition-colors hover:border-[var(--brand-primary)] hover:text-[var(--text-primary)]"
        >
          Edit
        </button>
      </div>
      <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function ReviewItem({
  label,
  value,
  fullWidth,
}: {
  label: string;
  value: string;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? "sm:col-span-2" : undefined}>
      <dt className="[font-family:var(--font-jetbrains-mono)] text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
        {label}
      </dt>
      <dd className="mt-1 whitespace-pre-wrap [font-family:var(--font-figtree)] text-sm leading-6 text-[var(--text-body)]">
        {value.trim() || "Not provided"}
      </dd>
    </div>
  );
}

export function SubmissionWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [furthestStep, setFurthestStep] = useState(0);
  const [showAllSteps, setShowAllSteps] = useState(false);
  const [values, setValues] = useState<FormValues>(initialValues);
  const formRef = useRef<HTMLFormElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const progress = ((currentStep + 1) / steps.length) * 100;
  const ActiveIcon = steps[currentStep].icon;

  function updateValue(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function focusStepTop() {
    requestAnimationFrame(() => {
      contentRef.current?.scrollIntoView({ block: "start" });
    });
  }

  function goToStep(step: number) {
    if (step > furthestStep) return;
    setCurrentStep(step);
    focusStepTop();
  }

  function validateCurrentStep() {
    const panel = formRef.current?.querySelector<HTMLElement>(
      `[data-step-panel="${currentStep}"]`,
    );
    const requiredFields =
      panel?.querySelectorAll<
        HTMLInputElement | HTMLTextAreaElement
      >("input[required], textarea[required]");

    if (!requiredFields) return true;

    for (const field of requiredFields) {
      if (!field.checkValidity()) {
        field.reportValidity();
        field.focus();
        return false;
      }
    }

    return true;
  }

  function goNext() {
    if (!validateCurrentStep()) return;

    const nextStep = Math.min(currentStep + 1, steps.length - 1);
    setCurrentStep(nextStep);
    setFurthestStep((current) => Math.max(current, nextStep));
    focusStepTop();
  }

  function goBack() {
    setCurrentStep((current) => Math.max(0, current - 1));
    focusStepTop();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (currentStep < steps.length - 1) {
      event.preventDefault();
      goNext();
    }
  }

  function startOver() {
    const hasValues = Object.values(values).some((value) => value.trim());
    if (
      hasValues &&
      !window.confirm("Start over and clear every field in this submission?")
    ) {
      return;
    }

    formRef.current?.reset();
    setValues(initialValues);
    setCurrentStep(0);
    setFurthestStep(0);
    setShowAllSteps(false);
    focusStepTop();
  }

  return (
    <main className="h-full w-full overflow-y-auto overscroll-none bg-[var(--bg-light)] text-[var(--text-body)]">
      <div
        ref={contentRef}
        className="mx-auto flex w-full max-w-[1120px] flex-col gap-5 px-4 pb-12 pt-5 sm:gap-6 sm:px-6 sm:py-7 xl:px-8 xl:py-8"
      >
        <header
          className="hacker-card-enter relative overflow-hidden rounded-[1.75rem] border border-[color:var(--bg-gray-dark)]/65 bg-[var(--bg-white)] p-5 sm:p-7"
          style={{ animationDelay: "40ms" }}
        >
          <div
            aria-hidden="true"
            className="absolute -right-10 -top-14 size-40 rounded-full border-[22px] border-[color:var(--bg-primary-light)]/65"
          />
          <div className="relative">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="[font-family:var(--font-jetbrains-mono)] text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)]">
                  Project submission
                </p>
                <h1 className="mt-2 [font-family:var(--font-fredoka)] text-3xl font-semibold tracking-[-0.035em] text-[var(--brand-secondary)] sm:text-4xl">
                  Submit your project
                </h1>
                <p className="mt-2 [font-family:var(--font-figtree)] text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
                  Work through each section at your own pace. Required fields
                  are marked with an asterisk.
                </p>
              </div>

              <button
                type="button"
                onClick={startOver}
                className="inline-flex w-fit items-center gap-2 rounded-full border border-[color:var(--brand-secondary)]/14 bg-[var(--bg-light)] px-4 py-2.5 [font-family:var(--font-figtree)] text-sm font-bold text-[var(--brand-secondary)] transition-colors hover:border-[var(--brand-primary)] hover:bg-[var(--bg-primary-light)]"
              >
                <RefreshCw aria-hidden="true" className="size-4" />
                Start over
              </button>
            </div>

            <div className="mt-7 flex items-center justify-between gap-4">
              <p className="[font-family:var(--font-figtree)] text-sm font-bold text-[var(--brand-secondary)]">
                {currentStep + 1} of {steps.length} steps
                <span className="mx-2 text-[var(--text-tertiary)]">·</span>
                <span className="font-medium text-[var(--text-secondary)]">
                  {steps[currentStep].shortLabel}
                </span>
              </p>
              <button
                type="button"
                onClick={() => setShowAllSteps((current) => !current)}
                aria-expanded={showAllSteps}
                className="shrink-0 rounded-full border border-[color:var(--brand-secondary)]/14 bg-white px-4 py-2 [font-family:var(--font-figtree)] text-xs font-bold text-[var(--brand-secondary)] transition-colors hover:border-[var(--brand-primary)]"
              >
                {showAllSteps ? "Hide steps" : "View all steps"}
              </button>
            </div>

            <div
              role="progressbar"
              aria-label="Project submission progress"
              aria-valuemin={1}
              aria-valuemax={steps.length}
              aria-valuenow={currentStep + 1}
              className="mt-3 h-2.5 overflow-hidden rounded-full bg-[var(--bg-gray)]"
            >
              <div
                className="relative h-full rounded-full bg-[var(--brand-primary)] transition-[width] duration-500 ease-out"
                style={{ width: `${progress}%` }}
              >
                <span className="absolute right-0 top-0 h-full w-5 rounded-full bg-[var(--brand-accent)]" />
              </div>
            </div>

            {showAllSteps ? (
              <ol className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {steps.map((step, index) => {
                  const StepIcon = step.icon;
                  const isCurrent = index === currentStep;
                  const isComplete = index < currentStep;
                  const isAvailable = index <= furthestStep;

                  return (
                    <li key={step.shortLabel}>
                      <button
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => goToStep(index)}
                        aria-current={isCurrent ? "step" : undefined}
                        className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-colors ${
                          isCurrent
                            ? "border-[var(--brand-primary)] bg-[var(--bg-primary-light)]"
                            : "border-[color:var(--bg-gray-dark)]/70 bg-white"
                        } disabled:cursor-not-allowed disabled:opacity-45`}
                      >
                        <span
                          className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                            isComplete
                              ? "bg-[var(--brand-accent)] text-white"
                              : "bg-[var(--bg-light)] text-[var(--text-primary)]"
                          }`}
                        >
                          {isComplete ? (
                            <Check aria-hidden="true" className="size-4" />
                          ) : (
                            <StepIcon aria-hidden="true" className="size-4" />
                          )}
                        </span>
                        <span className="[font-family:var(--font-figtree)] text-xs font-bold text-[var(--brand-secondary)]">
                          {index + 1}. {step.shortLabel}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            ) : null}
          </div>
        </header>

        <form
          ref={formRef}
          action={submitProject}
          onSubmit={handleSubmit}
          className="hacker-card-enter overflow-hidden rounded-[1.75rem] border border-[color:var(--bg-gray-dark)]/65 bg-[var(--bg-white)]"
          style={{ animationDelay: "120ms" }}
        >
          {Object.entries(values).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}

          <div
            key={currentStep}
            data-step-panel={currentStep}
            className="hacker-card-enter"
          >
            <div className="border-b border-[var(--bg-gray)] px-5 py-5 sm:px-8 sm:py-6">
              <div className="flex items-start gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--bg-primary-light)] text-[var(--text-primary)]">
                  <ActiveIcon aria-hidden="true" className="size-5" />
                </span>
                <div>
                  <p className="[font-family:var(--font-jetbrains-mono)] text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                    Step {currentStep + 1}
                  </p>
                  <h2 className="mt-1 [font-family:var(--font-fredoka)] text-2xl font-semibold tracking-[-0.02em] text-[var(--brand-secondary)] sm:text-3xl">
                    {steps[currentStep].label}
                  </h2>
                  <p className="mt-1 max-w-2xl [font-family:var(--font-figtree)] text-sm leading-6 text-[var(--text-secondary)]">
                    {steps[currentStep].description}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-5 py-6 sm:px-8 sm:py-8">
              {currentStep === 0 ? (
                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    id="projectName"
                    label="Project title"
                    required
                    className="md:col-span-2"
                  >
                    <Input
                      id="projectName"
                      required
                      autoFocus
                      value={values.projectName}
                      onChange={(event) =>
                        updateValue("projectName", event.target.value)
                      }
                      placeholder="e.g., Campus Compass"
                      className={inputClassName}
                    />
                  </FormField>

                  <FormField
                    id="description"
                    label="Information about your project"
                    required
                    hint="Describe the problem, your solution, and the main features your team built."
                    className="md:col-span-2"
                  >
                    <Textarea
                      id="description"
                      required
                      rows={6}
                      aria-describedby="description-hint"
                      value={values.description}
                      onChange={(event) =>
                        updateValue("description", event.target.value)
                      }
                      placeholder="Tell us what your project does and why it matters."
                      className={`${textareaClassName} min-h-40`}
                    />
                  </FormField>

                  <FormField
                    id="tagline"
                    label="Elevator pitch"
                    className="md:col-span-2"
                  >
                    <Input
                      id="tagline"
                      value={values.tagline}
                      onChange={(event) =>
                        updateValue("tagline", event.target.value)
                      }
                      placeholder="One memorable sentence about your project."
                      className={inputClassName}
                    />
                  </FormField>

                  <FormField
                    id="teamMembers"
                    label="Team members"
                    required
                    hint="Add one person per line."
                  >
                    <Textarea
                      id="teamMembers"
                      required
                      rows={5}
                      aria-describedby="teamMembers-hint"
                      value={values.teamMembers}
                      onChange={(event) =>
                        updateValue("teamMembers", event.target.value)
                      }
                      placeholder={"Linus Gao\nTeammate name"}
                      className={textareaClassName}
                    />
                  </FormField>

                  <FormField
                    id="builtWith"
                    label="Tech stack"
                    required
                    hint="Separate tools and technologies with commas."
                  >
                    <Textarea
                      id="builtWith"
                      required
                      rows={5}
                      aria-describedby="builtWith-hint"
                      value={values.builtWith}
                      onChange={(event) =>
                        updateValue("builtWith", event.target.value)
                      }
                      placeholder="Next.js, TypeScript, Neon, Python…"
                      className={textareaClassName}
                    />
                  </FormField>
                </div>
              ) : null}

              {currentStep === 1 ? (
                <div className="grid gap-8">
                  <section>
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-xl bg-[var(--bg-primary-light)] text-[var(--text-primary)]">
                        <Github aria-hidden="true" className="size-4" />
                      </span>
                      <div>
                        <h3 className="[font-family:var(--font-fredoka)] text-xl font-semibold text-[var(--brand-secondary)]">
                          Project links
                        </h3>
                        <p className="[font-family:var(--font-figtree)] text-xs text-[var(--text-secondary)]">
                          GitHub is required. Add demos if they are ready.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-6 md:grid-cols-2">
                      <FormField
                        id="githubLink"
                        label="GitHub URL"
                        required
                        className="md:col-span-2"
                      >
                        <FieldIcon icon={Github}>
                          <Input
                            id="githubLink"
                            type="url"
                            required
                            autoFocus
                            value={values.githubLink}
                            onChange={(event) =>
                              updateValue("githubLink", event.target.value)
                            }
                            placeholder="https://github.com/team/project"
                            className={`${inputClassName} pl-11`}
                          />
                        </FieldIcon>
                      </FormField>

                      <FormField id="youtubeLink" label="YouTube demo">
                        <FieldIcon icon={Youtube}>
                          <Input
                            id="youtubeLink"
                            type="url"
                            value={values.youtubeLink}
                            onChange={(event) =>
                              updateValue("youtubeLink", event.target.value)
                            }
                            placeholder="https://youtube.com/watch?v=..."
                            className={`${inputClassName} pl-11`}
                          />
                        </FieldIcon>
                      </FormField>

                      <FormField id="demoLink" label="Live demo">
                        <FieldIcon icon={Rocket}>
                          <Input
                            id="demoLink"
                            type="url"
                            value={values.demoLink}
                            onChange={(event) =>
                              updateValue("demoLink", event.target.value)
                            }
                            placeholder="https://your-project.com"
                            className={`${inputClassName} pl-11`}
                          />
                        </FieldIcon>
                      </FormField>
                    </div>
                  </section>

                  <div className="h-px bg-[var(--bg-gray)]" />

                  <section>
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-xl bg-[var(--bg-success-light)] text-[var(--text-success)]">
                        <ContactRound aria-hidden="true" className="size-4" />
                      </span>
                      <div>
                        <h3 className="[font-family:var(--font-fredoka)] text-xl font-semibold text-[var(--brand-secondary)]">
                          Emergency contact
                        </h3>
                        <p className="[font-family:var(--font-figtree)] text-xs text-[var(--text-secondary)]">
                          This information is only for event safety.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-6 md:grid-cols-2">
                      <FormField
                        id="emergencyContactName"
                        label="Contact name"
                        required
                      >
                        <Input
                          id="emergencyContactName"
                          required
                          value={values.emergencyContactName}
                          onChange={(event) =>
                            updateValue(
                              "emergencyContactName",
                              event.target.value,
                            )
                          }
                          placeholder="Full name"
                          className={inputClassName}
                        />
                      </FormField>

                      <FormField
                        id="emergencyContactPhone"
                        label="Phone number"
                        required
                      >
                        <Input
                          id="emergencyContactPhone"
                          type="tel"
                          required
                          value={values.emergencyContactPhone}
                          onChange={(event) =>
                            updateValue(
                              "emergencyContactPhone",
                              event.target.value,
                            )
                          }
                          placeholder="(416) 555-0123"
                          className={inputClassName}
                        />
                      </FormField>

                      <FormField
                        id="emergencyContactRelationship"
                        label="Relationship to you"
                        required
                        className="md:col-span-2"
                      >
                        <Input
                          id="emergencyContactRelationship"
                          required
                          value={values.emergencyContactRelationship}
                          onChange={(event) =>
                            updateValue(
                              "emergencyContactRelationship",
                              event.target.value,
                            )
                          }
                          placeholder="Parent, guardian, sibling, partner…"
                          className={inputClassName}
                        />
                      </FormField>
                    </div>
                  </section>
                </div>
              ) : null}

              {currentStep === 2 ? (
                <div className="grid gap-6">
                  <FormField
                    id="challengesFaced"
                    label="Challenges you faced"
                    hint="Technical roadblocks, product decisions, or teamwork challenges all count."
                  >
                    <Textarea
                      id="challengesFaced"
                      autoFocus
                      rows={5}
                      aria-describedby="challengesFaced-hint"
                      value={values.challengesFaced}
                      onChange={(event) =>
                        updateValue("challengesFaced", event.target.value)
                      }
                      placeholder="What was the hardest part of building your project?"
                      className={textareaClassName}
                    />
                  </FormField>

                  <FormField
                    id="lessonsLearned"
                    label="What you learned"
                  >
                    <Textarea
                      id="lessonsLearned"
                      rows={5}
                      value={values.lessonsLearned}
                      onChange={(event) =>
                        updateValue("lessonsLearned", event.target.value)
                      }
                      placeholder="Share a new skill, insight, or lesson your team is taking away."
                      className={textareaClassName}
                    />
                  </FormField>

                  <FormField id="nextSteps" label="What’s next">
                    <Textarea
                      id="nextSteps"
                      rows={5}
                      value={values.nextSteps}
                      onChange={(event) =>
                        updateValue("nextSteps", event.target.value)
                      }
                      placeholder="How would you continue or improve the project after the hackathon?"
                      className={textareaClassName}
                    />
                  </FormField>
                </div>
              ) : null}

              {currentStep === 3 ? (
                <div className="grid gap-4">
                  <ReviewSection
                    title="Project details"
                    step={0}
                    onEdit={goToStep}
                  >
                    <ReviewItem
                      label="Project title"
                      value={values.projectName}
                    />
                    <ReviewItem
                      label="Elevator pitch"
                      value={values.tagline}
                    />
                    <ReviewItem
                      label="Project information"
                      value={values.description}
                      fullWidth
                    />
                    <ReviewItem
                      label="Team members"
                      value={values.teamMembers}
                    />
                    <ReviewItem label="Tech stack" value={values.builtWith} />
                  </ReviewSection>

                  <ReviewSection
                    title="Links and contact"
                    step={1}
                    onEdit={goToStep}
                  >
                    <ReviewItem label="GitHub" value={values.githubLink} />
                    <ReviewItem label="YouTube" value={values.youtubeLink} />
                    <ReviewItem label="Live demo" value={values.demoLink} />
                    <ReviewItem
                      label="Emergency contact"
                      value={`${values.emergencyContactName}\n${values.emergencyContactPhone}\n${values.emergencyContactRelationship}`}
                    />
                  </ReviewSection>

                  <ReviewSection
                    title="Build story"
                    step={2}
                    onEdit={goToStep}
                  >
                    <ReviewItem
                      label="Challenges"
                      value={values.challengesFaced}
                      fullWidth
                    />
                    <ReviewItem
                      label="What you learned"
                      value={values.lessonsLearned}
                      fullWidth
                    />
                    <ReviewItem
                      label="What’s next"
                      value={values.nextSteps}
                      fullWidth
                    />
                  </ReviewSection>

                  <Label className="mt-2 flex cursor-pointer items-start gap-3 rounded-2xl border border-[color:var(--brand-primary)]/20 bg-[var(--bg-primary-light)]/55 p-4 [font-family:var(--font-figtree)] text-sm leading-6 text-[var(--text-body)]">
                    <input
                      type="checkbox"
                      name="submissionConfirmed"
                      required
                      className="mt-1 size-4 shrink-0 accent-[var(--brand-primary)]"
                    />
                    <span>
                      I confirm these details are accurate and the project is
                      ready to be reviewed by judges.
                    </span>
                  </Label>
                </div>
              ) : null}
            </div>

            <footer className="flex flex-col-reverse gap-3 border-t border-[var(--bg-gray)] bg-[var(--bg-light)]/65 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <Button
                type="button"
                variant="outline"
                onClick={goBack}
                disabled={currentStep === 0}
                className="h-12 rounded-full border-[color:var(--brand-secondary)]/14 bg-white px-5 [font-family:var(--font-figtree)] text-sm font-bold text-[var(--brand-secondary)] shadow-none hover:bg-[var(--bg-primary-light)] disabled:invisible"
              >
                <ArrowLeft aria-hidden="true" className="size-4" />
                Back
              </Button>

              <p
                aria-live="polite"
                className="hidden [font-family:var(--font-jetbrains-mono)] text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--text-secondary)] sm:block"
              >
                Step {currentStep + 1} of {steps.length}
              </p>

              {currentStep < steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={goNext}
                  className="h-12 rounded-full bg-[var(--brand-secondary)] px-6 [font-family:var(--font-figtree)] text-sm font-bold text-white shadow-none transition-transform hover:-translate-y-0.5 hover:bg-[var(--brand-secondary)]"
                >
                  Next step
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Button>
              ) : (
                <SubmitButton />
              )}
            </footer>
          </div>
        </form>

        <div className="flex items-center justify-center gap-2 [font-family:var(--font-figtree)] text-xs text-[var(--text-secondary)]">
          <Users aria-hidden="true" className="size-4 text-[var(--brand-accent)]" />
          Your form stays on this device until you submit or leave the page.
        </div>
      </div>
    </main>
  );
}

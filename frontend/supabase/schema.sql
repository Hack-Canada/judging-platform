-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.admin_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT admin_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.calendar_schedule_slots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  date date NOT NULL,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  submission_id uuid NOT NULL,
  room_id integer NOT NULL,
  judge_ids ARRAY NOT NULL DEFAULT ARRAY[]::uuid[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT calendar_schedule_slots_pkey PRIMARY KEY (id),
  CONSTRAINT calendar_schedule_slots_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.submissions(id)
);
CREATE TABLE public.judge_investments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  judge_id uuid NOT NULL,
  submission_id uuid NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT judge_investments_pkey PRIMARY KEY (id),
  CONSTRAINT judge_investments_judge_id_fkey FOREIGN KEY (judge_id) REFERENCES public.judges(id),
  CONSTRAINT judge_investments_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.submissions(id)
);
CREATE TABLE public.judge_project_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  judge_id uuid NOT NULL,
  submission_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT judge_project_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT judge_project_assignments_judge_id_fkey FOREIGN KEY (judge_id) REFERENCES public.judges(id),
  CONSTRAINT judge_project_assignments_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.submissions(id)
);
CREATE TABLE public.judges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  assigned_projects integer NOT NULL DEFAULT 0,
  total_invested numeric NOT NULL DEFAULT 0,
  tracks ARRAY NOT NULL DEFAULT ARRAY['General'::text],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT judges_pkey PRIMARY KEY (id)
);
CREATE TABLE public.submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  team_name text NOT NULL,
  members ARRAY NOT NULL DEFAULT ARRAY[]::text[],
  devpost_link text NOT NULL,
  project_name text NOT NULL,
  tracks ARRAY NOT NULL DEFAULT ARRAY[]::text[],
  submitted_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT submissions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.judge_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  judge_id uuid NOT NULL REFERENCES public.judges(id) ON DELETE CASCADE,
  submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT judge_notes_pkey PRIMARY KEY (id),
  CONSTRAINT judge_notes_judge_id_submission_id_key UNIQUE (judge_id, submission_id)
);
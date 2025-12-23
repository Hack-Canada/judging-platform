-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.judge_investments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  judge_id uuid NOT NULL,
  project_id uuid NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT judge_investments_pkey PRIMARY KEY (id),
  CONSTRAINT judge_investments_judge_id_fkey FOREIGN KEY (judge_id) REFERENCES public.judges(id),
  CONSTRAINT judge_investments_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.judge_project_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  judge_id uuid NOT NULL,
  project_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT judge_project_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT judge_project_assignments_judge_id_fkey FOREIGN KEY (judge_id) REFERENCES public.judges(id),
  CONSTRAINT judge_project_assignments_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.judges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  assigned_projects integer NOT NULL DEFAULT 0,
  total_invested numeric NOT NULL DEFAULT 0,
  tracks ARRAY NOT NULL DEFAULT '{General}'::text[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT judges_pkey PRIMARY KEY (id)
);
CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  status text NOT NULL DEFAULT 'Active'::text,
  track text NOT NULL DEFAULT 'General'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT projects_pkey PRIMARY KEY (id)
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
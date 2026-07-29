CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name text NOT NULL,
  tracks text[] NOT NULL DEFAULT ARRAY[]::text[],
  submitter_name text,
  submitter_email text,
  members text[] NOT NULL DEFAULT ARRAY[]::text[],
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS projects_project_name_idx
  ON public.projects (project_name);

CREATE INDEX IF NOT EXISTS projects_submitted_at_idx
  ON public.projects (submitted_at DESC NULLS LAST);

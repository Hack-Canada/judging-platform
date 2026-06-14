-- Run this in the Supabase SQL Editor to create the test table.
-- Drop and recreate if it already exists.
DROP TABLE IF EXISTS public.test_submissions;

CREATE TABLE public.test_submissions (
  id              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  project_name    text                     NOT NULL,
  devpost_link    text,
  tracks          text[]                   NOT NULL DEFAULT ARRAY[]::text[],
  submitter_name  text,
  submitter_email text,
  members         text[]                   NOT NULL DEFAULT ARRAY[]::text[],
  created_at      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT test_submissions_pkey PRIMARY KEY (id)
);

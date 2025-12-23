-- Supabase Schema for Judging Platform
-- This reflects the current database structure using submissions instead of projects

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

CREATE TABLE public.judge_project_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  judge_id uuid NOT NULL,
  submission_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT judge_project_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT judge_project_assignments_judge_id_fkey FOREIGN KEY (judge_id) REFERENCES public.judges(id),
  CONSTRAINT judge_project_assignments_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.submissions(id) ON DELETE CASCADE,
  CONSTRAINT judge_project_assignments_judge_id_submission_id_key UNIQUE (judge_id, submission_id)
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
  CONSTRAINT judge_investments_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.submissions(id) ON DELETE CASCADE,
  CONSTRAINT judge_investments_judge_id_submission_id_key UNIQUE (judge_id, submission_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_judges_name ON public.judges(name);
CREATE INDEX IF NOT EXISTS idx_judges_email ON public.judges(email);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON public.submissions(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_project_name ON public.submissions(project_name);
CREATE INDEX IF NOT EXISTS idx_judge_project_assignments_judge_id ON public.judge_project_assignments(judge_id);
CREATE INDEX IF NOT EXISTS idx_judge_project_assignments_submission_id ON public.judge_project_assignments(submission_id);
CREATE INDEX IF NOT EXISTS idx_judge_investments_judge_id ON public.judge_investments(judge_id);
CREATE INDEX IF NOT EXISTS idx_judge_investments_submission_id ON public.judge_investments(submission_id);

-- Enable Realtime for tables (optional, but recommended for live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.judges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.judge_project_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.judge_investments;

CREATE TABLE public.calendar_schedule_slots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  date date NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  submission_id uuid NOT NULL,
  room_id integer NOT NULL,
  judge_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT calendar_schedule_slots_pkey PRIMARY KEY (id),
  CONSTRAINT calendar_schedule_slots_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.submissions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_calendar_schedule_slots_date ON public.calendar_schedule_slots(date);
CREATE INDEX IF NOT EXISTS idx_calendar_schedule_slots_submission_id ON public.calendar_schedule_slots(submission_id);

-- Add comments for documentation
COMMENT ON TABLE public.judges IS 'Judges who evaluate submissions';
COMMENT ON TABLE public.submissions IS 'Project submissions from hackers';
COMMENT ON TABLE public.judge_project_assignments IS 'Assignments of judges to submissions';
COMMENT ON TABLE public.judge_investments IS 'Investment amounts allocated by judges to submissions';
COMMENT ON TABLE public.calendar_schedule_slots IS 'Calendar schedule slots for judging sessions';

-- Updated Supabase Schema - Using submissions instead of projects
-- Run this migration in your Supabase SQL Editor

-- Step 1: Update judge_investments to use submission_id instead of project_id
-- Drop foreign key constraint first
ALTER TABLE public.judge_investments 
  DROP CONSTRAINT IF EXISTS judge_investments_project_id_fkey;

-- Drop unique constraint if it exists
ALTER TABLE public.judge_investments
  DROP CONSTRAINT IF EXISTS judge_investments_judge_id_project_id_key;

-- Rename the column
ALTER TABLE public.judge_investments 
  RENAME COLUMN project_id TO submission_id;

-- Add new foreign key constraint
ALTER TABLE public.judge_investments
  ADD CONSTRAINT judge_investments_submission_id_fkey 
  FOREIGN KEY (submission_id) REFERENCES public.submissions(id) ON DELETE CASCADE;

-- Add new unique constraint
ALTER TABLE public.judge_investments
  ADD CONSTRAINT judge_investments_judge_id_submission_id_key 
  UNIQUE (judge_id, submission_id);

-- Step 2: Update judge_project_assignments to use submission_id instead of project_id
-- Drop foreign key constraint first
ALTER TABLE public.judge_project_assignments 
  DROP CONSTRAINT IF EXISTS judge_project_assignments_project_id_fkey;

-- Drop unique constraint if it exists  
ALTER TABLE public.judge_project_assignments
  DROP CONSTRAINT IF EXISTS judge_project_assignments_judge_id_project_id_key;

-- Rename the column
ALTER TABLE public.judge_project_assignments 
  RENAME COLUMN project_id TO submission_id;

-- Add new foreign key constraint
ALTER TABLE public.judge_project_assignments
  ADD CONSTRAINT judge_project_assignments_submission_id_fkey 
  FOREIGN KEY (submission_id) REFERENCES public.submissions(id) ON DELETE CASCADE;

-- Add new unique constraint
ALTER TABLE public.judge_project_assignments
  ADD CONSTRAINT judge_project_assignments_judge_id_submission_id_key 
  UNIQUE (judge_id, submission_id);

-- Step 3: Update indexes
DROP INDEX IF EXISTS idx_judge_investments_project_id;
CREATE INDEX IF NOT EXISTS idx_judge_investments_submission_id ON public.judge_investments(submission_id);

DROP INDEX IF EXISTS idx_judge_project_assignments_project_id;
CREATE INDEX IF NOT EXISTS idx_judge_project_assignments_submission_id ON public.judge_project_assignments(submission_id);

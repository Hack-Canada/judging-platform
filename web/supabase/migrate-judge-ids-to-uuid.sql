-- Migration script to change judge_ids from integer[] to uuid[] in calendar_schedule_slots table
-- Run this in your Supabase SQL editor if the table already exists with integer[] type

-- Step 1: Check the current column type
SELECT 
  column_name, 
  data_type, 
  udt_name,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name = 'calendar_schedule_slots' 
  AND column_name = 'judge_ids';

-- Step 2: If the column type is integer[], migrate it to uuid[]
-- WARNING: This will delete all existing judge_ids data in the column!
-- The column will be dropped and recreated with uuid[] type.

DO $$
BEGIN
  -- Check if column exists and is integer[]
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'calendar_schedule_slots'
      AND column_name = 'judge_ids'
      AND udt_name = '_int4'  -- integer[] type in PostgreSQL
  ) THEN
    -- Drop the old column
    ALTER TABLE public.calendar_schedule_slots 
      DROP COLUMN judge_ids;
    
    -- Add it back as uuid[]
    ALTER TABLE public.calendar_schedule_slots 
      ADD COLUMN judge_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[];
    
    RAISE NOTICE 'Successfully migrated judge_ids from integer[] to uuid[]';
  ELSE
    RAISE NOTICE 'judge_ids column does not exist or is already uuid[] - no migration needed';
  END IF;
END $$;

-- Step 3: Verify the change
SELECT 
  column_name, 
  data_type, 
  udt_name,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name = 'calendar_schedule_slots' 
  AND column_name = 'judge_ids';

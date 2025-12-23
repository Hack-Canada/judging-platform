-- Seed 10 judges
--  - All judges have "General"
--  - 3 judges also have "RBC Track"
--  - 2 judges also have "Uber Track"
-- Run this in the Supabase SQL editor.

DO $$
BEGIN
  -- General-only judges
  INSERT INTO public.judges (name, email, tracks)
  VALUES
    ('Emily Wong', 'emily+wong@example.com', ARRAY['General']),
    ('James Cao', 'james+cao@example.com', ARRAY['General']),
    ('Alex Kim', 'alex+kim@example.com', ARRAY['General']),
    ('Taylor Singh', 'taylor+singh@example.com', ARRAY['General']),
    ('Jordan Patel', 'jordan+patel@example.com', ARRAY['General']);

  -- RBC judges (also General)
  INSERT INTO public.judges (name, email, tracks)
  VALUES
    ('RBC Judge 1', 'rbc1@example.com', ARRAY['General', 'RBC Track']),
    ('RBC Judge 2', 'rbc2@example.com', ARRAY['General', 'RBC Track']),
    ('RBC Judge 3', 'rbc3@example.com', ARRAY['General', 'RBC Track']);

  -- Uber judges (also General)
  INSERT INTO public.judges (name, email, tracks)
  VALUES
    ('Uber Judge 1', 'uber1@example.com', ARRAY['General', 'Uber Track']),
    ('Uber Judge 2', 'uber2@example.com', ARRAY['General', 'Uber Track']);

  RAISE NOTICE 'Inserted 10 judges (5 General-only, 3 General+RBC, 2 General+Uber)';
END $$;


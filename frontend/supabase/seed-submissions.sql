-- Seed 100 submissions with randomized data
-- Run this in your Supabase SQL Editor

-- First, let's create a function to generate random submissions
DO $$
DECLARE
  i INTEGER;
  hacker_name TEXT;
  team_name TEXT;
  project_name TEXT;
  devpost_link TEXT;
  member_count INTEGER;
  member_names TEXT[];
  selected_tracks TEXT[];
  track_count INTEGER;
  track_options TEXT[] := ARRAY['General', 'RBC Track', 'Uber Track', 'Solo Hack', 'Beginners Hack'];
  first_names TEXT[] := ARRAY['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Cameron', 'Quinn', 'Avery', 'Sage', 'Rowan', 'Blake', 'Dakota', 'River', 'Skyler', 'Phoenix', 'Finley', 'Hayden', 'Reese', 'Emery', 'Sawyer', 'Kai', 'Nico', 'Sam', 'Jamie', 'Parker', 'Robin', 'Drew', 'Logan', 'Corey', 'Dylan', 'Harper', 'Emery', 'Shannon', 'Dana', 'Jordan', 'Leslie', 'Kendall', 'Tatum', 'Adrian'];
  last_names TEXT[] := ARRAY['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'];
  team_adjectives TEXT[] := ARRAY['Awesome', 'Brilliant', 'Creative', 'Dynamic', 'Efficient', 'Fast', 'Genius', 'Heroic', 'Innovative', 'Jazzy', 'Keen', 'Luminous', 'Mighty', 'Nimble', 'Optimal', 'Powerful', 'Quick', 'Radical', 'Smart', 'Turbo', 'Ultimate', 'Vibrant', 'Wise', 'Xtreme', 'Yummy', 'Zen'];
  team_nouns TEXT[] := ARRAY['Builders', 'Coders', 'Creators', 'Developers', 'Engineers', 'Hackers', 'Innovators', 'Makers', 'Pioneers', 'Problem Solvers', 'Techies', 'Visionaries', 'Wizards', 'Architects', 'Designers', 'Explorers', 'Geniuses', 'Heroes', 'Legends', 'Masters', 'Ninjas', 'Pros', 'Stars', 'Titans', 'Warriors'];
  project_adjectives TEXT[] := ARRAY['Smart', 'Intelligent', 'Advanced', 'Innovative', 'Revolutionary', 'Cutting-Edge', 'Next-Gen', 'Modern', 'Efficient', 'Optimized', 'Automated', 'AI-Powered', 'Cloud-Based', 'Mobile', 'Web', 'Social', 'Health', 'Finance', 'Education', 'Entertainment', 'Productivity', 'Communication', 'Security', 'Analytics', 'Platform'];
  project_nouns TEXT[] := ARRAY['Assistant', 'Manager', 'Tracker', 'Dashboard', 'Platform', 'System', 'App', 'Tool', 'Solution', 'Service', 'Hub', 'Network', 'Interface', 'Portal', 'Engine', 'Framework', 'Library', 'API', 'Bot', 'Agent', 'Analyzer', 'Optimizer', 'Generator', 'Converter', 'Visualizer'];
  member_first_names TEXT[];
BEGIN
  -- Loop to create 100 submissions
  FOR i IN 1..100 LOOP
    -- Generate random hacker name
    hacker_name := first_names[1 + floor(random() * array_length(first_names, 1))] || ' ' || 
                   last_names[1 + floor(random() * array_length(last_names, 1))];
    
    -- Generate random team name
    team_name := team_adjectives[1 + floor(random() * array_length(team_adjectives, 1))] || ' ' || 
                 team_nouns[1 + floor(random() * array_length(team_nouns, 1))];
    
    -- Generate random project name
    project_name := project_adjectives[1 + floor(random() * array_length(project_adjectives, 1))] || ' ' || 
                    project_nouns[1 + floor(random() * array_length(project_nouns, 1))];
    
    -- Generate devpost link
    devpost_link := 'https://devpost.com/software/' || lower(replace(project_name, ' ', '-')) || '-' || i;
    
    -- Random number of members (0-4, including the hacker)
    member_count := floor(random() * 5)::INTEGER;
    member_names := ARRAY[]::TEXT[];
    
    -- Generate member names (excluding the main hacker)
    IF member_count > 0 THEN
      FOR j IN 1..member_count LOOP
        member_names := array_append(member_names, 
          first_names[1 + floor(random() * array_length(first_names, 1))] || ' ' || 
          last_names[1 + floor(random() * array_length(last_names, 1))]);
      END LOOP;
    END IF;
    
    -- Select 1-3 random tracks (always include at least one)
    track_count := 1 + floor(random() * 3)::INTEGER;
    selected_tracks := ARRAY[]::TEXT[];
    
    -- Shuffle and pick unique tracks
    FOR j IN 1..track_count LOOP
      DECLARE
        selected_track TEXT;
      BEGIN
        -- Select a random track that hasn't been selected yet
        LOOP
          selected_track := track_options[1 + floor(random() * array_length(track_options, 1))];
          EXIT WHEN NOT (selected_track = ANY(selected_tracks));
        END LOOP;
        selected_tracks := array_append(selected_tracks, selected_track);
      END;
    END LOOP;
    
    -- Insert the submission
    INSERT INTO public.submissions (
      name,
      team_name,
      members,
      devpost_link,
      project_name,
      tracks,
      submitted_at,
      created_at
    ) VALUES (
      hacker_name,
      team_name,
      member_names,
      devpost_link,
      project_name,
      selected_tracks,
      NOW() - (random() * INTERVAL '30 days'), -- Random submission time in last 30 days
      NOW() - (random() * INTERVAL '30 days')
    );
  END LOOP;
  
  RAISE NOTICE 'Successfully inserted 100 submissions';
END $$;

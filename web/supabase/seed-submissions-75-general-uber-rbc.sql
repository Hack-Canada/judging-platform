-- Seed 75 additional submissions with only General + some Uber/RBC tracks
-- All submissions include 'General' and may optionally include 'Uber Track' and/or 'RBC Track'.
-- Run this script in your Supabase SQL Editor.

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
  first_names TEXT[] := ARRAY[
    'Alex','Jordan','Taylor','Morgan','Casey','Riley','Cameron','Quinn','Avery','Sage',
    'Rowan','Blake','Dakota','River','Skyler','Phoenix','Finley','Hayden','Reese','Emery',
    'Sawyer','Kai','Nico','Sam','Jamie','Parker','Robin','Drew','Logan','Corey',
    'Dylan','Harper','Emery','Shannon','Dana','Jordan','Leslie','Kendall','Tatum','Adrian'
  ];
  last_names TEXT[] := ARRAY[
    'Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez',
    'Hernandez','Lopez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin','Lee',
    'Thompson','White','Harris','Sanchez','Clark','Ramirez','Lewis','Robinson','Walker','Young',
    'Allen','King','Wright','Scott','Torres','Nguyen','Hill','Flores','Green','Adams','Nelson',
    'Baker','Hall','Rivera','Campbell','Mitchell','Carter','Roberts'
  ];
  team_adjectives TEXT[] := ARRAY[
    'Awesome','Brilliant','Creative','Dynamic','Efficient','Fast','Genius','Heroic','Innovative','Jazzy',
    'Keen','Luminous','Mighty','Nimble','Optimal','Powerful','Quick','Radical','Smart','Turbo',
    'Ultimate','Vibrant','Wise','Xtreme','Yummy','Zen'
  ];
  team_nouns TEXT[] := ARRAY[
    'Builders','Coders','Creators','Developers','Engineers','Hackers','Innovators','Makers','Pioneers','Problem Solvers',
    'Techies','Visionaries','Wizards','Architects','Designers','Explorers','Geniuses','Heroes','Legends','Masters',
    'Ninjas','Pros','Stars','Titans','Warriors'
  ];
  project_adjectives TEXT[] := ARRAY[
    'Smart','Intelligent','Advanced','Innovative','Revolutionary','Cutting-Edge','Next-Gen','Modern','Efficient','Optimized',
    'Automated','AI-Powered','Cloud-Based','Mobile','Web','Social','Health','Finance','Education','Entertainment',
    'Productivity','Communication','Security','Analytics','Platform'
  ];
  project_nouns TEXT[] := ARRAY[
    'Assistant','Manager','Tracker','Dashboard','Platform','System','App','Tool','Solution','Service',
    'Hub','Network','Interface','Portal','Engine','Framework','Library','API','Bot','Agent',
    'Analyzer','Optimizer','Generator','Converter','Visualizer'
  ];
BEGIN
  -- Insert 75 submissions
  FOR i IN 1..75 LOOP
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
    devpost_link := 'https://devpost.com/software/' || lower(replace(project_name, ' ', '-')) || '-g' || i;

    -- Random number of additional team members (0-4)
    member_count := floor(random() * 5)::INTEGER;
    member_names := ARRAY[]::TEXT[];

    IF member_count > 0 THEN
      FOR j IN 1..member_count LOOP
        member_names := array_append(
          member_names,
          first_names[1 + floor(random() * array_length(first_names, 1))] || ' ' ||
          last_names[1 + floor(random() * array_length(last_names, 1))]
        );
      END LOOP;
    END IF;

    -- Always include General, optionally add Uber/RBC
    selected_tracks := ARRAY['General'];

    -- ~40% chance to also be an Uber Track submission
    IF random() < 0.40 THEN
      selected_tracks := array_append(selected_tracks, 'Uber Track');
    END IF;

    -- ~40% chance to also be an RBC Track submission
    IF random() < 0.40 THEN
      selected_tracks := array_append(selected_tracks, 'RBC Track');
    END IF;

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
      NOW() - (random() * INTERVAL '30 days'),
      NOW() - (random() * INTERVAL '30 days')
    );
  END LOOP;

  RAISE NOTICE 'Successfully inserted 75 submissions (General + optional Uber/RBC)';
END $$;

